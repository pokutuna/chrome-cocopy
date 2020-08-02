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

  errors: {
    name?: string;
    backgroundColor?: boolean;
    pattern?: string;
    code?: string;
  };
  canSave: boolean;
}

type Action =
  | {t: 'edit'; name: string; value: string}
  | {t: 'palette'}
  | {t: 'parse'; error?: string}
  | {t: 'save'}
  | {t: 'cancel'}
  | {t: 'delete'};

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
    errors: {},
    canSave: true,
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

function validateEdit(
  errors: State['errors'],
  action: {
    t: 'edit';
    name: string;
    value: string;
  }
): State['errors'] {
  switch (action.name) {
    case 'name':
      errors.name = action.value.length === 0 ? 'Cannot be empty.' : undefined;
      break;
    case 'backgroundColor': {
      const valid = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(action.value);
      errors.backgroundColor = !valid;
      break;
    }
    case 'pattern':
      try {
        new RegExp(action.value);
        errors.pattern = undefined;
      } catch (e) {
        errors.pattern = e.message;
      }
      break;
  }
  return errors;
}

function handleEdit(
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
    } else {
      next.textColor = '#000';
    }
  } else {
    next.openPalette = false;
  }

  next.errors = validateEdit(state.errors, action);

  state.fnDispatch({t: 'edit', function: stateToFn(next)});
  return next;
}

function canSave(state: State): boolean {
  return Object.values(state.errors).every(e => !e);
}

export function reducer(state: State, action: Action): State {
  console.log(action);
  switch (action.t) {
    case 'edit': {
      const next = handleEdit(state, action);
      next.canSave = canSave(next);
      return next;
    }
    case 'palette':
      return {...state, openPalette: !state.openPalette};
    case 'parse': {
      const next = {...state};
      next.errors.code = action.error;
      next.canSave = canSave(next);
      return next;
    }
    case 'save':
      state.fnDispatch({t: 'save', functionId: state.fn.id});
      return state;
    case 'cancel':
      state.fnDispatch({t: 'cancel'});
      return state;
    case 'delete':
      state.fnDispatch({t: 'delete', functionId: state.fn.id});
      return state;
  }
}
