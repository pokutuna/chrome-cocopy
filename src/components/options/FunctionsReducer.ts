import {CopyFunctionWithTheme, newFunction} from '../../lib/function';

export interface State {
  activeId: string | undefined;
  functions: CopyFunctionWithTheme[];
  editing: CopyFunctionWithTheme | undefined;
  draggable: boolean;
}

type Action =
  | {t: 'init'; functions: CopyFunctionWithTheme[]}
  | {t: 'select'; functionId: string}
  | {t: 'add'}
  // Editing
  | {t: 'edit'; function: Partial<CopyFunctionWithTheme>}
  | {t: 'save'}
  | {t: 'cancel'}
  | {t: 'delete'}
  // Drag & Drop
  | {t: 'dragging'; dragIndex: number; hoverIndex: number}
  | {t: 'dropped'};

export const initialState = {
  activeId: undefined,
  functions: [],
  editing: undefined,
  draggable: true,
};

export type DispatchType = (action: Action) => void;

const newId = 'new';

const dragging = (
  functions: CopyFunctionWithTheme[],
  dragIndex: number,
  hoverIndex: number
) => {
  const [dragging] = functions.splice(dragIndex, 1);
  functions.splice(hoverIndex, 0, dragging);
  return functions;
};

function hasEdited(state: State): boolean {
  if (state.activeId === newId) return true;

  const orig = state.functions.find(f => f.id === state.activeId)!;
  const item = state.editing;
  if (!item) return false;
  return (
    orig.name !== item.name ||
    orig.code !== item.code ||
    orig.pattern !== item.pattern ||
    orig.theme.textColor !== item.theme.textColor ||
    orig.theme.backgroundColor !== item.theme.backgroundColor
  );
}

function reduce(state: State, action: Action): State {
  switch (action.t) {
    case 'init':
      return {...state, functions: action.functions};
    case 'select': {
      const close = state.activeId === action.functionId;
      const next = reduce(state, {t: 'cancel'});
      if (close || next.activeId !== undefined) return next;

      next.activeId = action.functionId;
      next.editing = state.functions.find(f => f.id === action.functionId);
      return next;
    }
    case 'edit':
      return {
        ...state,
        editing: {...state.editing!, ...action.function},
      };
    case 'save': {
      if (state.activeId === newId) {
        state.functions.push(state.editing!);
      } else {
        const idx = state.functions.findIndex(f => f.id === state.activeId);
        state.functions[idx] = state.editing!;
      }
      // save
      return {...state, activeId: undefined, editing: undefined};
    }
    case 'cancel': {
      const edited = hasEdited(state);
      if (edited && !confirm('Are you sure you want to discard changes?')) {
        return state;
      }
      return {...state, activeId: undefined, editing: undefined};
    }
    case 'delete': {
      if (!confirm('Are you sure you want to delete this function?')) {
        return state;
      }
      const functions = state.functions.filter(f => f.id !== state.activeId);
      // TODO save
      return {...state, functions, activeId: undefined, editing: undefined};
    }
    case 'dragging':
      return {
        ...state,
        functions: dragging(
          state.functions,
          action.dragIndex,
          action.hoverIndex
        ),
      };
    case 'dropped':
      console.log('dropped');
      // TODO save
      return state;
    case 'add': {
      const next = reduce(state, {t: 'cancel'});
      const newFn = newFunction();
      return {...next, editing: newFn, activeId: newId};
    }
  }
}

export function reducer(state: State, action: Action): State {
  const next = reduce(state, action);
  next.draggable = next.activeId === undefined;
  return next;
}
