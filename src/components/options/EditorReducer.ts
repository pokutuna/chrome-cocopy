import {CopyFunction, currentVersion} from '../../lib/function';
import {textColorFromBgColor, isColorCode} from '../../lib/util';

/**
 * Callbacks the editor uses to reach its owner. Save/delete are asynchronous in
 * the owner (they go through FunctionRepository), so the editor no longer
 * decides on its own whether a change was saved.
 */
export interface EditorCallbacks {
  onEdit: (fn: Omit<CopyFunction, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

interface State {
  fn: CopyFunction;
  callbacks: EditorCallbacks;

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

export function init(fn: CopyFunction, callbacks: EditorCallbacks): State {
  return {
    fn,
    callbacks,
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

export function stateToFn(state: State): Omit<CopyFunction, 'id'> {
  return {
    name: state.name,
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
  action: EditAction,
): State['errors'] {
  switch (action.name) {
    case 'name':
      errors.name = action.value.length === 0 ? 'Cannot be empty.' : undefined;
      break;
    case 'backgroundColor': {
      const valid = isColorCode(action.value);
      errors.backgroundColor = !valid;
      break;
    }
    case 'pattern':
      try {
        new RegExp(action.value);
        errors.pattern = undefined;
      } catch (e) {
        if (e instanceof Error) {
          errors.pattern = e.message;
        } else {
          errors.pattern = `Unknown error: ${e}`;
        }
      }
      break;
  }
  return errors;
}

function removeTrailingSpace(code: string): string {
  return code
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n');
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

  state.callbacks.onEdit(stateToFn(next));
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
    case 'save': {
      // remove trailing space; this also pushes the final draft to the owner
      // before the save is requested.
      const next = handleEdit(state, {
        t: 'edit',
        name: 'code',
        value: removeTrailingSpace(state.code),
      });
      state.callbacks.onSave();
      return next;
    }
    case 'cancel':
      state.callbacks.onCancel();
      return state;
    case 'delete':
      state.callbacks.onDelete();
      return state;
  }
}

export function reducer(state: State, action: Action): State {
  const next = reduce(state, action);
  next.canSave = canSave(next);
  return next;
}
