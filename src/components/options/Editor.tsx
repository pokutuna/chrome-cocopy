import {h} from 'preact';
import {useReducer, useMemo, useCallback} from 'preact/hooks';

import debounce from 'lodash.debounce';

import {CopyFunctionWithTheme} from '../../lib/function';
import {EvaluatePayload, EvaluateResult} from '../../lib/eval';
import {Box, Row, Item, Button} from './Parts';
import {TextInput} from './Input';
import {ColorInput} from './Color';
import {CodeEditor} from './Code';
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
  const onClickPalette = useCallback(() => dispatch({t: 'palette'}), [
    dispatch,
  ]);

  const parse = useMemo(() => {
    const evaluate = useSandbox<EvaluatePayload, EvaluateResult>(res =>
      dispatch({t: 'parse', error: res.error ? res.error.message : undefined})
    );
    return debounce(evaluate, 200);
  }, [dispatch]);

  const onCodeEdit = useCallback(
    (value: string) => {
      parse({command: 'parse', code: value});
      dispatch({t: 'edit', name: 'code', value});
    },
    [dispatch, parse]
  );

  return (
    <form>
      <Box>
        <Row>
          <Item style={{width: '4rem'}}>
            <TextInput
              label="Symbol"
              name="symbol"
              placeholder="☺"
              value={state.symbol}
              onInput={onEdit}
            />
          </Item>
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
              onClickPalette={onClickPalette}
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
            <Button>Save</Button>
          </Item>
          <Item>
            <Button>Cancel</Button>
          </Item>
          <Item style={{marginLeft: 'auto'}}>
            <Button>Delete</Button>
          </Item>
        </Row>
      </Box>
    </form>
  );
}
