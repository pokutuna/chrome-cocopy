import {DispatchType as FnDispatchType} from './FunctionsReducer';
import {CopyFunctionWithTheme} from '../../lib/function';
import {textColorFromBgColor} from '../../lib/util';
interface State {
  fn: CopyFunctionWithTheme;
  fnDispatch: FnDispatchType;

  symbol: string;
  name: string;
  textColor: string;
  backgroundColor: string;
  pattern?: string;
  code: string;
  openPalette: boolean;
}

type Action =
  | {t: 'edit'; name: string; value: string}
  | {t: 'palette'}
  | {t: 'save'; value: string}
  | {t: 'cancel'; value: string}
  | {t: 'delete'; value: string};

export function init(
  fn: CopyFunctionWithTheme,
  fnDispatch: FnDispatchType
): State {
  return {
    fn,
    fnDispatch,
    symbol: fn.theme.symbol,
    name: fn.name,
    textColor: fn.theme.textColor,
    backgroundColor: fn.theme.backgroundColor,
    pattern: fn.pattern,
    code: fn.code,
    openPalette: false,
  };
}

export type DispatchType = (action: Action) => void;

function stateToFn(state: State): Partial<CopyFunctionWithTheme> {
  return {
    name: state.name,
    code: state.code,
    pattern: state.pattern,
    theme: {
      symbol: state.symbol,
      textColor: state.textColor,
      backgroundColor: state.backgroundColor,
    },
  };
}

function handleEditType(
  state: State,
  action: {
    t: 'edit';
    name: string;
    value: string;
  }
): State {
  const next = {...state, [action.name]: action.value};
  if (action.name === 'backgroundColor') {
    if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(action.value)) {
      next.textColor = textColorFromBgColor(next.backgroundColor);
    }
  } else {
    next.openPalette = false;
  }

  state.fnDispatch({t: 'edit', function: stateToFn(next)});
  return next;
}

export function reducer(state: State, action: Action): State {
  console.log(action);
  switch (action.t) {
    case 'edit':
      return handleEditType(state, action);
    case 'palette':
      return {...state, openPalette: !state.openPalette};
    default:
      throw new Error(`unexpected action: ${action.t}`);
  }
}
