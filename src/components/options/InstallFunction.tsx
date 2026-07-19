import {faDizzy} from '@fortawesome/free-solid-svg-icons/faDizzy';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {memo, useReducer, useMemo} from 'react';
import {useLocation} from 'react-router-dom';

import {addCopyFunctions} from '../../lib/config';
import {CopyFunction, isCopyFunction} from '../../lib/function';
import {decodeSharable} from '../../lib/share';
import {FunctionItem} from '../common/FunctionParts';
import {Editor} from './Editor';
import {EditorBox} from './FunctionList';
import {Action} from './FunctionsReducer';
import {Section, TextList} from './Parts';

import styles from './InstallFunction.module.css';

interface State {
  fn?: CopyFunction;
}

// partially emulate FunctionsReducer
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
    <div className={styles.noticeFrame}>
      <TextList>
        <li>Sharing this URL makes others can use this function.</li>
        <li>You can edit the code and every fields before installation.</li>
      </TextList>
    </div>
  );
});

const FailedMessage = memo(() => {
  return (
    <div className={styles.center}>
      <FontAwesomeIcon icon={faDizzy} size="10x" />
      <h3>This URL is broken.</h3>
    </div>
  );
});

function useSahredFunction(): CopyFunction | undefined {
  const location = useLocation();
  const fn = useMemo<CopyFunction | undefined>(() => {
    const params = new URLSearchParams(location.search);
    const decoded = decodeSharable(params.get('f') || '');
    return isCopyFunction(decoded) ? decoded : undefined;
  }, [location]);
  return fn;
}

export function InstallFunction() {
  const fn = useSahredFunction();
  const [state, dispatch] = useReducer(reduce, {fn});

  return (
    <Section title="Install Function">
      {state.fn ? (
        <EditorBox>
          <Notice />
          <FunctionItem fn={state.fn} />
          <Editor function={state.fn} dispatch={dispatch} install />
        </EditorBox>
      ) : (
        <FailedMessage />
      )}
    </Section>
  );
}
