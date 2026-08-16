import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {renderHook} from '@testing-library/react';
import {vi} from 'vitest';

import {createConfigStore} from '../../lib/config';
import {CopyFunction} from '../../lib/function';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {seedSnapshot} from '../../lib/function-store/repository.test-helpers';
import {
  ConflictError,
  CorruptionError,
  QuotaError,
} from '../../lib/function-store/types';
import {en, ja} from '../../lib/i18n';
import {
  FunctionList,
  textForListError,
  useFunctionListStore,
} from './FunctionList';
import {ListError} from './FunctionsReducer';
import {
  createTestStore,
  renderWithStore,
  seedStore,
  TestStore,
} from './test-helpers';

function fn(id: string, overrides: Partial<CopyFunction> = {}): CopyFunction {
  return {
    id,
    name: `name-${id}`,
    code: `return "${id}";`,
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#ffffff'},
    ...overrides,
  };
}

/** The English wording for a stored error, as the list would render it. */
function errorText(error: ListError | undefined): string {
  return error ? textForListError(en, error) : '';
}

/** Reads the committed catalog straight from storage, bypassing the UI. */
async function storedIds(store: TestStore): Promise<string[]> {
  const refs = await store.repository.list();
  return refs.map(ref => ref.id);
}

function renderStore(store: TestStore) {
  return renderHook(() => useFunctionListStore(store.repository));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

test('lists refs from the repository without reading documents', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const getSpy = vi.spyOn(store.sync, 'get');
  const {result} = renderStore(store);

  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));
  expect(result.current.state.refs.map(r => r.id)).toEqual(['a', 'b']);

  // Function Documents are only read when an editor is opened.
  const readKeys = getSpy.mock.calls.flatMap(([keys]) => keys);
  expect(readKeys.some(key => key.includes(':function:'))).toBe(false);
});

test('opening a function loads its code', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[1]);
  });

  expect(result.current.state.activeId).toBe('b');
  expect(result.current.state.editing?.code).toBe('return "b";');
  expect(result.current.state.original?.code).toBe('return "b";');
});

test('a successful save persists and reloads the list from the repository', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'renamed'}});
  });

  await act(async () => {
    result.current.saveFunction();
  });

  await waitFor(() => expect(result.current.state.saved).toBe(true));
  expect(result.current.state.saving).toBe(false);
  expect(result.current.state.error).toBeUndefined();

  // The displayed list comes from the repository, not from local state.
  expect(result.current.state.refs.map(r => r.name)).toEqual([
    'renamed',
    'name-b',
  ]);
  const stored = await store.repository.list();
  expect(stored[0].name).toBe('renamed');
  expect(await store.repository.get(stored[0])).toMatchObject({
    id: 'a',
    name: 'renamed',
  });
});

test('a double-fired save runs the mutation only once', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'renamed'}});
  });

  const updateSpy = vi.spyOn(store.repository, 'update');
  // Both calls land before `state.saving` is rendered; the second would
  // otherwise conflict against the already-rotated documentId.
  await act(async () => {
    result.current.saveFunction();
    result.current.saveFunction();
  });

  await waitFor(() => expect(result.current.state.saving).toBe(false));
  expect(updateSpy).toHaveBeenCalledTimes(1);
  expect(result.current.state.error).toBeUndefined();
});

test('editing while a save is in flight keeps the new draft unsaved', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'submitted'}});
  });

  // Type again before the repository promise resolves. Only 'submitted' is
  // persisted, so the later draft must not be treated as saved content.
  await act(async () => {
    result.current.saveFunction();
    result.current.dispatch({t: 'edit', function: {name: 'typed during save'}});
  });

  await waitFor(() => expect(result.current.state.saving).toBe(false));
  expect(result.current.state.error).toBeUndefined();

  // What actually reached storage is the draft as submitted.
  const stored = await store.repository.list();
  expect(stored[0].name).toBe('submitted');

  // The editor still holds the newer draft and reports it as unsaved...
  expect(result.current.state.editing?.name).toBe('typed during save');
  expect(result.current.state.saved).toBe(false);

  // ...so closing prompts instead of silently discarding it.
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  act(() => result.current.dispatch({t: 'cancel'}));
  expect(confirmSpy).toHaveBeenCalled();
  expect(result.current.state.editing?.name).toBe('typed during save');
  confirmSpy.mockRestore();
});

test('closing after a successful save does not prompt to discard', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'renamed'}});
  });
  await act(async () => {
    result.current.saveFunction();
  });
  await waitFor(() => expect(result.current.state.saved).toBe(true));

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  act(() => result.current.dispatch({t: 'cancel'}));

  expect(confirmSpy).not.toHaveBeenCalled();
  expect(result.current.state.activeId).toBeUndefined();
});

test('a new function is created and the editor closes', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  act(() => result.current.dispatch({t: 'add'}));
  expect(result.current.state.activeId).toBe('new');
  const createdId = result.current.state.editing!.id;

  await act(async () => {
    result.current.saveFunction();
  });

  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));
  expect(result.current.state.activeId).toBeUndefined();
  expect(await storedIds(store)).toEqual(['a', createdId]);
});

test('a ConflictError keeps the draft, reloads the list, and shows an error', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'my draft'}});
  });

  // Another window committed a different snapshot in the meantime.
  vi.spyOn(store.repository, 'update').mockRejectedValueOnce(
    new ConflictError('changed elsewhere'),
  );
  await seedSnapshot(
    store.sync,
    [fn('a', {name: 'from other window'}), fn('b')],
    {
      catalogId: 'other-catalog',
      documentIds: ['other-doc-1', 'other-doc-2'],
    },
  );

  await act(async () => {
    result.current.saveFunction();
  });

  await waitFor(() => expect(result.current.state.error).toBeDefined());
  expect(errorText(result.current.state.error)).toContain(
    'changed in another window',
  );
  expect(result.current.state.saving).toBe(false);
  expect(result.current.state.saved).toBe(false);

  // The draft survives so the user can retry, while the list is re-read.
  expect(result.current.state.activeId).toBe('a');
  expect(result.current.state.editing?.name).toBe('my draft');
  expect(result.current.state.refs.map(r => r.name)).toEqual([
    'from other window',
    'name-b',
  ]);
});

test('a save over an entry changed since the editor opened conflicts, then saving again overwrites', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'my draft'}});
  });

  // Another window saves the same function while this editor is open. The
  // commit succeeds long before our save starts, so only the editor's base
  // documentId can catch it.
  await act(async () => {
    await store.repository.update(fn('a', {name: 'theirs'}));
  });

  await act(async () => {
    result.current.saveFunction();
  });

  await waitFor(() => expect(result.current.state.error).toBeDefined());
  expect(errorText(result.current.state.error)).toContain(
    'changed in another window',
  );
  expect((await store.repository.list())[0].name).toBe('theirs');
  expect(result.current.state.editing?.name).toBe('my draft');

  // The failure re-armed the base to the reloaded entry, so saving again is
  // the deliberate overwrite the error message offers.
  await act(async () => {
    result.current.saveFunction();
  });
  await waitFor(() => expect(result.current.state.saved).toBe(true));
  expect((await store.repository.list())[0].name).toBe('my draft');
});

test('a QuotaError is reported without losing the draft', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'too big'}});
  });

  vi.spyOn(store.repository, 'update').mockRejectedValueOnce(
    new QuotaError('Saving would use too much sync storage.', {
      limitKind: 'total-bytes',
      limit: 92160,
      actual: 100000,
    }),
  );

  await act(async () => {
    result.current.saveFunction();
  });

  await waitFor(() => expect(result.current.state.error).toBeDefined());
  expect(errorText(result.current.state.error)).toContain(
    'Not enough sync storage',
  );
  expect(result.current.state.editing?.name).toBe('too big');
});

test('delete removes the function after confirmation', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  act(() => result.current.deleteFunction());
  expect(confirmSpy).toHaveBeenCalled();
  expect(await storedIds(store)).toEqual(['a', 'b']);

  confirmSpy.mockReturnValue(true);
  await act(async () => {
    result.current.deleteFunction();
  });

  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));
  expect(result.current.state.activeId).toBeUndefined();
  expect(await storedIds(store)).toEqual(['b']);
});

test('a drop persists the new order', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b'), fn('c')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(3));

  // dnd-kit fires move and onDropped synchronously from onDragEnd, so the
  // reducer's dragOrder is not yet visible when dropped runs (regression: the
  // order used to be read back through stateRef and the reorder never ran).
  await act(async () => {
    result.current.moveFunction(2, 0);
    result.current.dropped();
  });

  await waitFor(() =>
    expect(result.current.state.refs.map(r => r.id)).toEqual(['c', 'a', 'b']),
  );
  expect(await storedIds(store)).toEqual(['c', 'a', 'b']);
  // The drag draft is dropped once the catalog is re-read.
  expect(result.current.state.dragOrder).toBeNull();
});

test('a failed reorder falls back to the stored order', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b'), fn('c')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(3));

  vi.spyOn(store.repository, 'reorder').mockRejectedValueOnce(
    new ConflictError('order is stale'),
  );

  act(() => result.current.moveFunction(2, 0));
  expect(result.current.state.dragOrder?.map(r => r.id)).toEqual([
    'c',
    'a',
    'b',
  ]);

  await act(async () => {
    result.current.dropped();
  });

  await waitFor(() => expect(result.current.state.error).toBeDefined());
  expect(result.current.state.dragOrder).toBeNull();
  expect(result.current.state.refs.map(r => r.id)).toEqual(['a', 'b', 'c']);
  expect(await storedIds(store)).toEqual(['a', 'b', 'c']);
});

test('an external change refreshes the list', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  // Simulate another context committing a new snapshot.
  await act(async () => {
    await seedSnapshot(store.sync, [fn('a'), fn('z')], {
      catalogId: 'external-catalog',
      documentIds: ['external-doc-1', 'external-doc-2'],
    });
  });

  await waitFor(() =>
    expect(result.current.state.refs.map(r => r.id)).toEqual(['a', 'z']),
  );
});

test('an external change does not discard the open draft', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(1));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'still typing'}});
  });

  await act(async () => {
    await seedSnapshot(store.sync, [fn('a'), fn('z')], {
      catalogId: 'external-catalog',
      documentIds: ['external-doc-1', 'external-doc-2'],
    });
  });

  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));
  expect(result.current.state.editing?.name).toBe('still typing');
});

test('clicking another function switches the editor in one action', async () => {
  // Regression: openFunction used to dispatch `cancel` and then read the
  // outcome through stateRef, which is stale until the next render, so the
  // second function never opened.
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  expect(result.current.state.activeId).toBe('a');

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[1]);
  });
  expect(result.current.state.activeId).toBe('b');
  expect(result.current.state.editing?.code).toBe('return "b";');
});

test('declining the discard prompt keeps the current editor open', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a'), fn('b')]);

  const {result} = renderStore(store);
  await waitFor(() => expect(result.current.state.refs).toHaveLength(2));

  await act(async () => {
    await result.current.openFunction(result.current.state.refs[0]);
  });
  act(() => {
    result.current.dispatch({t: 'edit', function: {name: 'unsaved draft'}});
  });

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await act(async () => {
    await result.current.openFunction(result.current.state.refs[1]);
  });

  expect(confirmSpy).toHaveBeenCalled();
  expect(result.current.state.activeId).toBe('a');
  expect(result.current.state.editing?.name).toBe('unsaved draft');

  // Accepting the prompt discards the draft and opens the other function.
  confirmSpy.mockReturnValue(true);
  await act(async () => {
    await result.current.openFunction(result.current.state.refs[1]);
  });
  expect(result.current.state.activeId).toBe('b');
});

test('an error with no open editor is shown at the list level', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);
  vi.spyOn(store.repository, 'list').mockRejectedValueOnce(
    new CorruptionError('broken catalog'),
  );

  render(renderWithStore(store, <FunctionList />));

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByRole('alert')).toHaveTextContent('broken catalog');
});

test('a displayed error follows a language change', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a')]);
  // A conflict is worded from the catalog, so the text is a translation
  // rather than the error's own English message.
  vi.spyOn(store.repository, 'list').mockRejectedValueOnce(
    new ConflictError('changed elsewhere'),
  );

  const configStore = createConfigStore(new InMemoryKeyValueStorage());
  render(renderWithStore(store, <FunctionList />, ['/'], configStore));

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.functionList.conflict,
    ),
  );

  await act(async () => {
    await configStore.update({language: 'ja'});
  });

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      ja.functionList.conflict,
    ),
  );
});

test('renders the list and opens an editor on click', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('a', {name: 'First'}), fn('b', {name: 'Second'})]);

  render(renderWithStore(store, <FunctionList />));

  await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument());
  expect(screen.getByText('Second')).toBeInTheDocument();

  fireEvent.click(screen.getByText('First'));

  await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());
  expect(screen.getByDisplayValue('First')).toBeInTheDocument();
  expect(screen.getByText('Delete')).toBeInTheDocument();
});
