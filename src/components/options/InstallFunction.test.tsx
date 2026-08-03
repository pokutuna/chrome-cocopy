import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi} from 'vitest';

import {CopyFunction} from '../../lib/function';
import {encodeSharable} from '../../lib/share';
import {InstallFunction} from './InstallFunction';
import {createTestStore, renderWithStore, seedStore} from './test-helpers';

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

function installPath(shared: CopyFunction): string {
  return `/install?f=${encodeURIComponent(encodeSharable(shared))}`;
}

test('installs a shared function under a fresh id', async () => {
  const store = createTestStore();
  // The existing function has the same id as the shared one.
  await seedStore(store, [fn('shared-id', {name: 'mine'})]);

  const shared = fn('shared-id', {name: 'from the web'});
  render(renderWithStore(store, <InstallFunction />, [installPath(shared)]));

  await waitFor(() => expect(screen.getByText('Install')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Install'));

  await waitFor(async () =>
    expect(await store.repository.list()).toHaveLength(2),
  );

  const refs = await store.repository.list();
  expect(refs.map(r => r.name)).toEqual(['mine', 'from the web']);
  // A new id was minted, so nothing collided with or overwrote the existing one.
  expect(refs[0].id).toBe('shared-id');
  expect(refs[1].id).not.toBe('shared-id');
});

test('shows an error when installing fails', async () => {
  const store = createTestStore();
  await seedStore(store, []);

  vi.spyOn(store.repository, 'create').mockRejectedValueOnce(
    new Error('storage exploded'),
  );

  render(renderWithStore(store, <InstallFunction />, [installPath(fn('x'))]));

  await waitFor(() => expect(screen.getByText('Install')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Install'));

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('storage exploded'),
  );
  expect(await store.repository.list()).toHaveLength(0);
});
