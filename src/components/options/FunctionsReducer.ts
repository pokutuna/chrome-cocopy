import {CopyFunctionWithTheme} from '../../lib/function';

export interface State {
  activeId: string | undefined;
  functions: CopyFunctionWithTheme[];
  editing: CopyFunctionWithTheme | undefined;
  editingBackup: CopyFunctionWithTheme | undefined;
  draggable: boolean;
}

type Action =
  | {t: 'init'; functions: CopyFunctionWithTheme[]}
  | {t: 'select'; functionId: string}
  | {t: 'add'}
  // Editing
  | {t: 'edit'; function: Partial<CopyFunctionWithTheme>}
  | {t: 'save'; functionId: string}
  | {t: 'cancel'}
  | {t: 'delete'; functionId: string}
  // Drag & Drop
  | {t: 'dragging'; dragIndex: number; hoverIndex: number}
  | {t: 'dropped'};

export const initialState = {
  activeId: undefined,
  functions: [],
  editing: undefined,
  editingBackup: undefined,
  draggable: true,
};

export type DispatchType = (action: Action) => void;

const dragging = (
  functions: CopyFunctionWithTheme[],
  dragIndex: number,
  hoverIndex: number
) => {
  const [dragging] = functions.splice(dragIndex, 1);
  functions.splice(hoverIndex, 0, dragging);
  return functions;
};

function reduce(state: State, action: Action): State {
  switch (action.t) {
    case 'init':
      return {...state, functions: action.functions};
    case 'select': {
      const changed = state.activeId !== action.functionId;
      const activeId = changed ? action.functionId : undefined;
      const editing = state.functions.find(f => f.id === activeId);
      return {...state, activeId, editing};
    }
    case 'edit':
      return {
        ...state,
        editing: {...state.editing!, ...action.function},
      };
    case 'save': {
      const next = {
        ...state,
      };
      return next;
    }
    case 'cancel':
      return {...state, activeId: undefined, editing: undefined};
    case 'delete':
      return state;
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
      return state;
    case 'add':
      return {...state};
  }
}

export function reducer(state: State, action: Action): State {
  const next = reduce(state, action);
  next.draggable = next.activeId === undefined;
  return next;
}
