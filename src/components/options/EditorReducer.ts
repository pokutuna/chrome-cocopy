import {DispatchType as FnDispatchType} from './FunctionsReducer';
import {CopyFunctionWithTheme, currentVersion} from '../../lib/function';
import {textColorFromBgColor} from '../../lib/util';
interface State {
  fn: CopyFunctionWithTheme;
  fnDispatch: FnDispatchType;

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

type EditAction = {t: 'edit'; name: string; value: string};
type Action =
  | EditAction
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

export function stateToFn(state: State): Omit<CopyFunctionWithTheme, 'id'> {
  return {
    name: state.name,
    types: ['page'],
    code: state.code,
    pattern: state.pattern,
    theme: {
      textColor: state.textColor,
      backgroundColor: state.backgroundColor,
    },
    version: currentVersion,
  };
}

function validateEdit(
  errors: State['errors'],
  action: EditAction
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

function handleEdit(state: State, action: EditAction): State {
  const next = {...state, [action.name]: action.value};
  if (action.name === 'backgroundColor') {
    if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(action.value)) {
      next.textColor = textColorFromBgColor(next.backgroundColor);
    } else {
      next.textColor = '#000'; // fallback when parsing failed
    }
  } else {
    next.openPalette = false;
  }

  if (action.name === 'pattern' && action.value === '') {
    next.pattern = undefined;
  }

  next.errors = validateEdit(state.errors, action);

  state.fnDispatch({t: 'edit', function: stateToFn(next)});
  return next;
}

function canSave(state: State): boolean {
  return Object.values(state.errors).every(e => !e);
}

function reduce(state: State, action: Action): State {
  switch (action.t) {
    case 'edit':
      return handleEdit(state, action);
    case 'palette':
      return {...state, openPalette: !state.openPalette};
    case 'parse': {
      const next = {...state};
      next.errors.code = action.error;
      return next;
    }
    case 'save':
      state.fnDispatch({t: 'save'});
      return state;
    case 'cancel':
      state.fnDispatch({t: 'cancel'});
      return state;
    case 'delete':
      state.fnDispatch({t: 'delete'});
      return state;
  }
}

export function reducer(state: State, action: Action): State {
  const next = reduce(state, action);
  next.canSave = canSave(next);
  return next;
}
