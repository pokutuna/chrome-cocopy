import {h} from 'preact';
import {useState, useCallback} from 'preact/hooks';

import {default as SimpleCodeEditor} from 'react-simple-code-editor';
import {highlight as hl, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

import {theme} from '../Theme';
import {
  TextInput,
  InputBox,
  Label,
  LabelSub,
  Box,
  Row,
  Item,
  Button,
} from './Parts';
import {ColorInput} from './Color';
import {FunctionItem} from '../Function';
import {CopyFunctionWithTheme} from '../../lib/function';

export function PreviewFuncitonItem(props: {function: CopyFunctionWithTheme}) {
  const [running, setRunning] = useState(false);
  const onClick = useCallback(() => {
    setRunning(true);
    setTimeout(() => setRunning(false), 300);
  }, []);

  return (
    <FunctionItem
      fn={props.function}
      index={1}
      running={running}
      onClick={onClick}
    />
  );
}

const CodeEditor = (props: {code: string; setCode: (code: string) => void}) => {
  const highlight = useCallback((code: string) => {
    const result = hl(code, languages.js);
    return result;
  }, []);

  return (
    <InputBox>
      <Label htmlFor="code">
        Code
        <LabelSub>Must be a single function.</LabelSub>
      </Label>
      <SimpleCodeEditor
        value={props.code}
        onValueChange={props.setCode}
        highlight={highlight}
        padding={theme.space[2]}
        textareaId="code"
        style={{
          fontSize: theme.size.base,
          fontFamily: theme.fontFamily.monospace,
          backgroundColor: theme.color.codeBg,
        }}
      />
    </InputBox>
  );
};

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

export function Editor() {
  const [code, setCode] = useState(initialCode);

  return (
    <form>
      <Box>
        <Row>
          <Item style={{width: '4rem'}}>
            <TextInput label="Symbol" name="icon" placeholder="☺" />
          </Item>
          <Item grow={1}>
            <TextInput label="Name" name="name" placeholder="" />
          </Item>
          <Item style={{width: '9rem'}}>
            <ColorInput />
          </Item>
        </Row>
        <TextInput
          label="URL Pattern"
          name="pattern"
          placeholder=".*"
          subLabel={
            <span>
              (optional) This function will be displayed if the URL matches.
            </span>
          }
        />
      </Box>

      <CodeEditor code={code} setCode={setCode} />

      <Box>
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
