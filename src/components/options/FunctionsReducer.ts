import {CopyFunction, newFunction} from '../../lib/function';
import {CopyFunctionRef} from '../../lib/function-store/types';

/**
 * UI state for the options function list.
 *
 * This reducer is pure: it never touches storage. Persisting a change is the
 * caller's job (see `useFunctionListStore` in FunctionList.tsx), because a
 * mutation only counts as saved once the repository promise resolves
 * (docs/function-storage.md, "options で関数を編集する").
 *
 * - `refs` comes from the catalog and carries no code.
 * - `editing` is the function open in the editor and `original` is the value it
 *   was loaded with, used for the discard-changes prompt.
 */
export interface State {
  activeId: string | undefined;
  refs: CopyFunctionRef[];
  /** Draft order while a drag is in progress; null when not dragging. */
  dragOrder: CopyFunctionRef[] | null;
  editing: CopyFunction | undefined;
  original: CopyFunction | undefined;
  draggable: boolean;
  saving: boolean;
  /** True only after a mutation resolved, cleared by any further edit. */
  saved: boolean;
  error: string | undefined;
}

export type Action =
  | {t: 'refresh'; refs: CopyFunctionRef[]}
  | {t: 'open'; fn: CopyFunction}
  | {t: 'add'}
  | {t: 'close'}
  | {t: 'edit'; function: Partial<CopyFunction>}
  | {t: 'cancel'}
  // Async mutation lifecycle, driven by useFunctionListStore.
  | {t: 'mutation-start'}
  | {t: 'mutation-succeeded'}
  | {t: 'mutation-failed'; message: string}
  | {t: 'error'; message: string | undefined}
  // Drag & Drop
  | {t: 'dragging'; dragIndex: number; hoverIndex: number};

export const initialState: State = {
  activeId: undefined,
  refs: [],
  dragOrder: null,
  editing: undefined,
  original: undefined,
  draggable: true,
  saving: false,
  saved: false,
  error: undefined,
};

export type DispatchType = (action: Action) => void;

export const newId = 'new';

export function moved(
  refs: CopyFunctionRef[],
  dragIndex: number,
  hoverIndex: number,
): CopyFunctionRef[] {
  const next = [...refs];
  const [item] = next.splice(dragIndex, 1);
  next.splice(hoverIndex, 0, item);
  return next;
}

/**
 * Compares the editor draft with the function as it was loaded. A function that
 * has not been created yet always counts as edited, so closing it prompts
 * before throwing the draft away.
 */
export function hasEdited(state: State): boolean {
  if (state.activeId === newId) return true;

  const orig = state.original;
  const item = state.editing;
  if (!orig || !item) return false;
  return (
    orig.name !== item.name ||
    orig.code !== item.code ||
    (orig.pattern || '') !== (item.pattern || '') ||
    orig.theme.textColor !== item.theme.textColor ||
    orig.theme.backgroundColor !== item.theme.backgroundColor
  );
}

/**
 * Asks before throwing away an edited draft. Shared by the reducer's `cancel`
 * and by `openFunction`, which must decide synchronously (a dispatched action's
 * outcome is not visible until the next render).
 */
export function confirmDiscard(state: State): boolean {
  return (
    !hasEdited(state) || confirm('Are you sure you want to discard changes?')
  );
}

function closeEditor(state: State): State {
  return {
    ...state,
    activeId: undefined,
    editing: undefined,
    original: undefined,
    saved: false,
    error: undefined,
  };
}

function reduce(state: State, action: Action): State {
  switch (action.t) {
    case 'refresh':
      // The catalog is the source of truth for the list. An open editor keeps
      // its draft, so a change from another window never discards typing.
      return {...state, refs: action.refs, dragOrder: null};
    case 'open':
      if (state.saving) return state;
      return {
        ...state,
        activeId: action.fn.id,
        editing: action.fn,
        original: action.fn,
        saved: false,
        error: undefined,
      };
    case 'add': {
      if (state.saving) return state;
      const next = reduce(state, {t: 'cancel'});
      if (next.activeId !== undefined) return next;
      return {
        ...next,
        editing: newFunction(),
        original: undefined,
        activeId: newId,
      };
    }
    case 'close':
      return closeEditor(state);
    case 'edit':
      if (!state.editing) return state;
      return {
        ...state,
        editing: {...state.editing, ...action.function},
        saved: false,
      };
    case 'cancel': {
      if (state.saving) return state;
      if (!confirmDiscard(state)) return state;
      return closeEditor(state);
    }
    case 'mutation-start':
      return {...state, saving: true, saved: false, error: undefined};
    case 'mutation-succeeded':
      return {
        ...state,
        saving: false,
        saved: true,
        error: undefined,
        // The draft is now what is stored, so closing the editor no longer
        // prompts about discarding changes.
        original: state.editing ?? state.original,
      };
    case 'mutation-failed':
      // The draft is deliberately kept so the user can retry.
      return {...state, saving: false, saved: false, error: action.message};
    case 'error':
      return {...state, error: action.message};
    case 'dragging': {
      if (state.saving) return state;
      return {
        ...state,
        dragOrder: moved(
          state.dragOrder ?? state.refs,
          action.dragIndex,
          action.hoverIndex,
        ),
      };
    }
  }
}

export function reducer(state: State, action: Action): State {
  const next = reduce(state, action);
  next.draggable = next.activeId === undefined && !next.saving;
  return next;
}

/** The order currently shown: the drag draft while dragging, else the catalog. */
export function visibleRefs(state: State): CopyFunctionRef[] {
  return state.dragOrder ?? state.refs;
}
