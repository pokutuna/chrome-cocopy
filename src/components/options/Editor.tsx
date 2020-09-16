import {h} from 'preact';
import {useReducer, useMemo, useCallback} from 'preact/hooks';

import debounce from 'lodash.debounce';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';

import {CopyFunctionWithTheme} from '../../lib/function';
import {EvalPayload, EvalResult} from '../../lib/eval';
import {Box, Row, Item, Button, ButtonIcon} from './Parts';
import {TextInput} from './Input';
import {ColorInput} from './Color';
import {CodeEditor} from './CodeEditor';
import {DispatchType as FnDispatchType} from './FunctionsReducer';
import {useSandbox} from '../common/Sandbox';
import {reducer, init} from './EditorReducer';

const initialCode = `
/**
 * Return value will be copied to clipboard.
 * @param {Object} target
 * @returns {(string|undefined|Promise)}
 */
({title, pageURL, content}) => {
  return [title, pageURL].join(' ');
}
`.trim();

type EditorProps = {
  function: CopyFunctionWithTheme;
  dispatch: FnDispatchType;
};

export function Editor(props: EditorProps) {
  const [state, dispatch] = useReducer(
    reducer,
    init(props.function, props.dispatch)
  );

  const onEdit = useCallback(
    (name: string, value: string) => dispatch({t: 'edit', name, value}),
    [dispatch]
  );
  const togglePalette = useCallback(() => dispatch({t: 'palette'}), [dispatch]);

  const _evaluate = useSandbox<EvalPayload, EvalResult>(
    useCallback(res => dispatch({t: 'parse', error: res.error?.message}), [
      dispatch,
    ])
  );
  const parse = useMemo(() => debounce(_evaluate, 200), [dispatch, _evaluate]);

  const onCodeEdit = useCallback(
    (value: string) => {
      parse({command: 'parse', code: value});
      dispatch({t: 'edit', name: 'code', value});
    },
    [dispatch, parse]
  );

  const onClickSave = useCallback(() => dispatch({t: 'save'}), [dispatch]);
  const onClickCancel = useCallback(() => dispatch({t: 'cancel'}), [dispatch]);
  const onClickDelete = useCallback(() => dispatch({t: 'delete'}), [dispatch]);

  return (
    <form>
      <Box>
        <Row>
          <Item grow={1}>
            <TextInput
              label="Name"
              name="name"
              placeholder=""
              value={state.name}
              onInput={onEdit}
              error={state.errors.name}
            />
          </Item>
          <Item style={{width: '9rem'}}>
            <ColorInput
              value={state.backgroundColor}
              onInput={onEdit}
              togglePalette={togglePalette}
              showPalette={state.openPalette}
              error={state.errors.backgroundColor}
            />
          </Item>
        </Row>
        <Row>
          <TextInput
            label="URL Pattern"
            name="pattern"
            placeholder=".*"
            subLabel={
              <span>
                (optional) This function will be displayed if the URL matches.
              </span>
            }
            value={state.pattern || ''}
            onInput={onEdit}
            error={state.errors.pattern}
          />
        </Row>
        <Row>
          <CodeEditor
            code={state.code}
            setCode={onCodeEdit}
            error={state.errors.code}
          />
        </Row>
        <Row>
          <Item>
            <Button onClick={onClickSave} disabled={!state.canSave}>
              Save
            </Button>
          </Item>
          <Item>
            <Button onClick={onClickCancel}>Cancel</Button>
          </Item>
          <Item style={{marginLeft: 'auto'}}>
            <Button onClick={onClickDelete} mode="danger">
              <ButtonIcon>
                <FontAwesomeIcon icon={faTrash} />
              </ButtonIcon>
              Delete
            </Button>
          </Item>
        </Row>
      </Box>
    </form>
  );
}
