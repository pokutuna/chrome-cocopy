import {h} from 'preact';
import {useReducer, useMemo} from 'preact/hooks';
import {useLocation} from 'react-router-dom';

import {
  CopyFunctionWithTheme,
  decodeSharable,
  isCopyFunctionWithTheme,
} from '../../lib/function';
import {addCopyFunctions} from '../../lib/config';
import {FunctionItem} from '../common/FunctionParts';
import {Section} from './Parts';
import {Editor} from './Editor';
import {ItemBody as FunctionBox, EditorBox} from './FunctionList';
import {Action} from './FunctionsReducer';

interface State {
  fn?: CopyFunctionWithTheme;
}

// emulate FunctionsReducer partially
function reduce(state: State, action: Action): State {
  switch (action.t) {
    case 'edit':
      if (!state.fn) return state;
      return {
        ...state,
        fn: {
          ...state.fn,
          ...action.function,
        },
      };
    case 'save':
      if (state.fn) {
        // XXX this doesn't care react-router-dom
        addCopyFunctions(state.fn).then(() => (location.href = 'options.html'));
      }
      return state;
    default:
      return state;
  }
}

function useSahredFunction(): CopyFunctionWithTheme | undefined {
  const location = useLocation();
  const fn = useMemo<CopyFunctionWithTheme | undefined>(() => {
    const params = new URLSearchParams(location.search);
    const decoded = decodeSharable(params.get('f') || '');
    return isCopyFunctionWithTheme(decoded) ? decoded : undefined;
  }, [location]);
  return fn;
}

export function InstallFunction() {
  const fn = useSahredFunction();
  const [state, dispatch] = useReducer(reduce, {fn});

  return (
    <Section title="Install">
      {state.fn && (
        <EditorBox>
          <FunctionBox>
            <FunctionItem fn={state.fn} />
          </FunctionBox>
          <Editor function={state.fn} dispatch={dispatch} install />
        </EditorBox>
      )}
    </Section>
  );
}
