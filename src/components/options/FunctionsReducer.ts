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
  /**
   * documentId the open function was loaded with, passed to `update` so a
   * save from another window during this editing session is a conflict
   * instead of a silent overwrite. Deliberately NOT touched by `refresh`:
   * only opening the editor or settling a mutation may move the base.
   */
  baseDocumentId: string | undefined;
  draggable: boolean;
  saving: boolean;
  /** True only after a mutation resolved, cleared by any further edit. */
  saved: boolean;
  error: string | undefined;
}

export type Action =
  | {t: 'refresh'; refs: CopyFunctionRef[]}
  | {t: 'open'; fn: CopyFunction; documentId: string}
  | {t: 'add'}
  | {t: 'close'}
  | {t: 'edit'; function: Partial<CopyFunction>}
  | {t: 'cancel'}
  // Async mutation lifecycle, driven by useFunctionListStore.
  | {t: 'mutation-start'}
  | {t: 'mutation-succeeded'; submitted?: CopyFunction}
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
  baseDocumentId: undefined,
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
    baseDocumentId: undefined,
    saved: false,
    error: undefined,
  };
}

/**
 * The base documentId after a mutation settled: the entry as the just-reloaded
 * catalog has it. After a success this is the document the save produced;
 * after a conflict it re-arms the editor so that "review your changes and save
 * again" deliberately overwrites, as the error message promises.
 */
function rearmedBase(state: State): string | undefined {
  if (state.activeId === undefined || state.activeId === newId) {
    return undefined;
  }
  return (
    state.refs.find(ref => ref.id === state.activeId)?.documentId ??
    state.baseDocumentId
  );
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
        baseDocumentId: action.documentId,
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
    case 'mutation-succeeded': {
      // `submitted` is the draft as it was when the mutation started, which is
      // what actually got persisted. Using it rather than the current draft
      // matters when the user keeps typing while the write is in flight:
      // adopting the newer draft as `original` would mark unsaved edits as
      // saved and let them be discarded without a prompt.
      const stored = action.submitted ?? state.editing ?? state.original;
      const next = {
        ...state,
        original: stored,
        baseDocumentId: rearmedBase(state),
      };
      return {
        ...next,
        saving: false,
        // Edits typed during the write were not persisted, so the editor must
        // not claim they were: it stays dirty and re-saveable, and closing it
        // still prompts.
        saved: !hasEdited(next),
        error: undefined,
      };
    }
    case 'mutation-failed':
      // The draft is deliberately kept so the user can retry.
      return {
        ...state,
        saving: false,
        saved: false,
        error: action.message,
        baseDocumentId: rearmedBase(state),
      };
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
