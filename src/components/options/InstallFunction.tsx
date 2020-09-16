import {h} from 'preact';
import {memo} from 'preact/compat';
import {useReducer, useMemo} from 'preact/hooks';
import {useLocation} from 'react-router-dom';

import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDizzy} from '@fortawesome/free-solid-svg-icons/faDizzy';

import {
  CopyFunctionWithTheme,
  decodeSharable,
  isCopyFunctionWithTheme,
} from '../../lib/function';
import {addCopyFunctions} from '../../lib/config';
import {FunctionItem} from '../common/FunctionParts';
import {Section, TextList} from './Parts';
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

const Notice = memo(() => {
  return (
    <TextList>
      <li>Sharing this URL makes others can use this function.</li>
      <li>You can edit the code and every fields before installing.</li>
    </TextList>
  );
});

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FailedMessage = memo(() => {
  return (
    <Center>
      <FontAwesomeIcon icon={faDizzy} size="10x" />
      <h3>This URL is broken.</h3>
    </Center>
  );
});

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
    <Section title="Install Function">
      {state.fn ? (
        <div>
          <Notice />
          <EditorBox>
            <FunctionBox>
              <FunctionItem fn={state.fn} />
            </FunctionBox>
            <Editor function={state.fn} dispatch={dispatch} install />
          </EditorBox>
        </div>
      ) : (
        <FailedMessage />
      )}
    </Section>
  );
}
