import {h} from 'preact';
import {useReducer, useCallback} from 'preact/hooks';

import {CopyFunctionWithTheme} from '../../lib/function';
import {Box, Row, Item, Button} from './Parts';
import {TextInput} from './Input';
import {ColorInput} from './Color';
import {CodeEditor} from './Code';
import {DispatchType as FnDispatchType} from './FunctionsReducer';
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
  const onCodeEdit = useCallback(
    (value: string) => dispatch({t: 'edit', name: 'code', value}),
    [dispatch]
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
          <CodeEditor code={state.code} setCode={onCodeEdit} />
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
