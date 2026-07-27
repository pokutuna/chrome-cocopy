import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useEffect, useCallback, useReducer, useRef} from 'react';

import {CopyFunction} from '../../lib/function';
import {FunctionRepository} from '../../lib/function-store/repository';
import {CopyFunctionRef} from '../../lib/function-store/types';
import {
  FunctionItem,
  AddFunctionItem,
  FunctionDisplay,
} from '../common/FunctionParts';
import {useFunctionRepository} from '../common/FunctionStoreContext';
import {DnDWrapper, useDnDItem} from './DnD';
import {Editor} from './Editor';
import {
  reducer,
  initialState,
  newId,
  moved,
  visibleRefs,
  confirmDiscard,
  DispatchType,
  State,
} from './FunctionsReducer';
import {Section} from './Parts';
import {useSubscribeFunctions} from './Subscribe';

import styles from './FunctionList.module.css';

export const Caret = (props: {active: boolean; onClick: () => void}) => {
  const {active, onClick} = props;
  return (
    <div className={styles.itemButton} onClick={onClick}>
      <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} size="lg" />
    </div>
  );
};

const DragKnob = (props: {draggable: boolean}) => {
  return (
    // dragKnobBox extends itemButton (was styled(ItemButton)); keep both
    // classes so the flex centering and size come from itemButton.
    <div
      className={[
        styles.itemButton,
        styles.dragKnobBox,
        props.draggable ? styles.draggable : '',
      ]
        .join(' ')
        .trim()}
    >
      <FontAwesomeIcon icon={faBars} />
    </div>
  );
};

export function EditorBox(props: {children?: React.ReactNode}) {
  return <div className={styles.editorBox}>{props.children}</div>;
}

function AddFunction(props: {onClick: () => void}) {
  return (
    <div className={styles.functionItemBox}>
      <div className={styles.itemButton} onClick={props.onClick}>
        <FontAwesomeIcon icon={faPlus} />
      </div>
      <AddFunctionItem onClick={props.onClick} />
    </div>
  );
}

/**
 * Wording for a failed mutation. Conflict and quota get their own message
 * because the user can act on them (docs/function-storage.md, "Data Integrity
 * and Error Handling").
 */
export function messageForError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? (error as {code: unknown}).code
      : undefined;
  if (code === 'conflict') {
    return 'These functions were changed in another window. The list has been reloaded; review your changes and save again.';
  }
  if (code === 'quota') {
    return `Not enough sync storage to save this. ${
      error instanceof Error ? error.message : ''
    }`.trim();
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Saving failed. Please try again.';
}

/**
 * Owns the options list state plus everything asynchronous around it.
 *
 * Persistence lives here rather than in the reducer: a mutation only counts as
 * saved once the repository promise resolves, and the list is then re-read from
 * the repository instead of being patched locally
 * (docs/function-storage.md, "options で関数を編集する").
 */
export function useFunctionListStore(repository: FunctionRepository) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Callbacks read the current state through a ref so their identity does not
  // change whenever the list or the draft does.
  const stateRef = useRef<State>(state);
  stateRef.current = state;

  const refresh = useCallback(async () => {
    try {
      dispatch({t: 'refresh', refs: await repository.list()});
    } catch (error) {
      dispatch({t: 'error', message: messageForError(error)});
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Another options page or the popup published a new snapshot: re-read the
  // catalog. The open draft is untouched.
  const onExternalChange = useCallback(() => void refresh(), [refresh]);
  useSubscribeFunctions(repository, onExternalChange);

  /**
   * Runs one mutation: disables the other actions, waits for persistence, then
   * re-reads the catalog. On failure the editor draft is kept for a retry.
   */
  const runMutation = useCallback(
    async (mutate: () => Promise<void>, onSuccess?: () => void) => {
      if (stateRef.current.saving) return;
      // The draft as submitted. `mutation-succeeded` compares it with the draft
      // at resolution time so typing during the write is not mistaken for
      // saved content.
      const submitted = stateRef.current.editing;
      dispatch({t: 'mutation-start'});
      try {
        await mutate();
      } catch (error) {
        // Reload first: a conflict means the stored list moved on, and a failed
        // commit still leaves the previous snapshot readable.
        await refresh();
        dispatch({t: 'mutation-failed', message: messageForError(error)});
        return;
      }
      await refresh();
      dispatch({t: 'mutation-succeeded', submitted});
      onSuccess?.();
    },
    [refresh],
  );

  const openFunction = useCallback(
    async (ref: CopyFunctionRef) => {
      const current = stateRef.current;
      if (current.saving) return;

      // Clicking a function while an editor is open closes that one first,
      // asking before discarding an edited draft. Decided here instead of
      // dispatching `cancel`: a dispatched action's outcome is not readable
      // through stateRef until the next render.
      if (current.activeId !== undefined) {
        if (!confirmDiscard(current)) return;
        dispatch({t: 'close'});
        // Clicking the already-open function only closes it.
        if (current.activeId === ref.id) return;
      }

      try {
        const fn = await repository.get(ref);
        if (!fn) {
          await refresh();
          dispatch({
            t: 'error',
            message:
              'This function is no longer stored. The list has been reloaded.',
          });
          return;
        }
        dispatch({t: 'open', fn});
      } catch (error) {
        dispatch({t: 'error', message: messageForError(error)});
      }
    },
    [repository, refresh],
  );

  const saveFunction = useCallback(() => {
    const {editing, activeId} = stateRef.current;
    if (!editing || activeId === undefined) return;
    const isNew = activeId === newId;
    void runMutation(
      () => (isNew ? repository.create(editing) : repository.update(editing)),
      // Creating closes the editor; editing keeps it open showing "Saved",
      // matching the previous behaviour.
      isNew ? () => dispatch({t: 'close'}) : undefined,
    );
  }, [repository, runMutation]);

  const deleteFunction = useCallback(() => {
    const id = stateRef.current.activeId;
    if (id === undefined) return;
    if (id === newId) {
      // Never persisted, so there is nothing to delete.
      dispatch({t: 'close'});
      return;
    }
    if (!confirm('Are you sure you want to delete this function?')) return;
    void runMutation(
      () => repository.delete(id),
      () => dispatch({t: 'close'}),
    );
  }, [repository, runMutation]);

  // dnd-kit reports the final move and the drop in the same tick, so the
  // reducer's dragOrder is not yet visible through stateRef when `dropped`
  // runs; the moved order is kept here as well.
  const pendingOrderRef = useRef<CopyFunctionRef[] | null>(null);

  const moveFunction = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      pendingOrderRef.current = moved(
        visibleRefs(stateRef.current),
        dragIndex,
        hoverIndex,
      );
      dispatch({t: 'dragging', dragIndex, hoverIndex});
    },
    [dispatch],
  );

  const dropped = useCallback(() => {
    const order = pendingOrderRef.current ?? stateRef.current.dragOrder;
    pendingOrderRef.current = null;
    if (!order) return;
    // The new order is already on screen; the refresh after the commit puts the
    // stored order back if it failed.
    void runMutation(() => repository.reorder(order.map(ref => ref.id)));
  }, [repository, runMutation]);

  return {
    state,
    dispatch,
    refresh,
    openFunction,
    saveFunction,
    deleteFunction,
    moveFunction,
    dropped,
  };
}

type FunctionListItemProps = {
  display: FunctionDisplay;
  index: number;
  draggable: boolean;
  /** The open draft, or undefined when this row's editor is closed. */
  editing?: CopyFunction;
  saving: boolean;
  saved: boolean;
  error?: string;
  dispatch: DispatchType;
  onOpen: () => void;
  onSave: () => void;
  onDelete: () => void;
};

function FunctionListItem(props: FunctionListItemProps) {
  const {display, index, draggable, editing} = props;
  const {isDragging, ref, handleRef} = useDnDItem({
    id: display.id,
    index,
    canDrag: draggable,
  });

  const onEdit = useCallback(
    (fn: Omit<CopyFunction, 'id'>) => props.dispatch({t: 'edit', function: fn}),
    [props.dispatch],
  );
  const onCancel = useCallback(
    () => props.dispatch({t: 'cancel'}),
    [props.dispatch],
  );

  return (
    <div ref={ref}>
      <div
        className={[styles.functionItemBox, isDragging ? styles.dragging : '']
          .join(' ')
          .trim()}
      >
        <Caret active={!!editing} onClick={props.onOpen} />
        <FunctionItem fn={display} onClick={props.onOpen} />
        <div ref={handleRef}>
          <DragKnob draggable={draggable} />
        </div>
      </div>
      {editing && (
        <EditorBox>
          <Editor
            function={editing}
            onEdit={onEdit}
            onSave={props.onSave}
            onCancel={onCancel}
            onDelete={props.onDelete}
            saving={props.saving}
            saved={props.saved}
            error={props.error}
          />
        </EditorBox>
      )}
    </div>
  );
}

export function FunctionList() {
  const repository = useFunctionRepository();
  const {
    state,
    dispatch,
    openFunction,
    saveFunction,
    deleteFunction,
    moveFunction,
    dropped,
  } = useFunctionListStore(repository);

  const onClickAdd = useCallback(() => dispatch({t: 'add'}), [dispatch]);

  const refs = visibleRefs(state);
  const newDraft = state.activeId === newId ? state.editing : undefined;

  return (
    <Section title="Functions">
      {/* Errors raised outside an open editor (a failed reorder, a list that
          cannot be read, a function that vanished) have no editor row to show
          them in. */}
      {state.error !== undefined && state.activeId === undefined && (
        <div className={styles.listError} role="alert">
          {state.error}
        </div>
      )}
      <DnDWrapper move={moveFunction} onDropped={dropped}>
        {refs.map((ref, idx) => {
          const active = ref.id === state.activeId;
          const editing = active ? state.editing : undefined;
          return (
            <FunctionListItem
              key={ref.id}
              index={idx}
              // While the editor is open the row previews the draft, so a name
              // or color change shows immediately in the list.
              display={editing ?? ref}
              editing={editing}
              draggable={state.draggable}
              saving={state.saving}
              saved={state.saved}
              error={active ? state.error : undefined}
              dispatch={dispatch}
              onOpen={() => void openFunction(ref)}
              onSave={saveFunction}
              onDelete={deleteFunction}
            />
          );
        })}

        {/* New Function */}
        <div className={styles.addFunctionBox}>
          {!newDraft ? (
            <AddFunction onClick={onClickAdd} />
          ) : (
            <FunctionListItem
              index={-1}
              display={newDraft}
              editing={newDraft}
              draggable={false}
              saving={state.saving}
              saved={state.saved}
              error={state.error}
              dispatch={dispatch}
              onOpen={() => dispatch({t: 'cancel'})}
              onSave={saveFunction}
              onDelete={deleteFunction}
            />
          )}
        </div>
      </DnDWrapper>
    </Section>
  );
}
