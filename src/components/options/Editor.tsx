import {h} from 'preact';
import {useState, useCallback} from 'preact/hooks';

import {default as SimpleCodeEditor} from 'react-simple-code-editor';
import {highlight as hl, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

import {theme} from '../Theme';
import {Section, TextInput, InputBox, Label} from './Parts';
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
    console.log(result, languages);
    return result;
  }, []);

  return (
    <InputBox>
      <Label htmlFor="code">Code</Label>
      <SimpleCodeEditor
        value={props.code}
        onValueChange={props.setCode}
        highlight={highlight}
        padding={theme.space[2]}
        textareaId="code"
        style={{
          fontSize: theme.size.lg,
          fontFamily: theme.fontFamily.monospace,
          backgroundColor: '#f5f2f0',
        }}
      />
    </InputBox>
  );
};

export function Editor() {
  const [code, setCode] = useState(
    '(target) => {\n  const a = "hoge"\n  lll\n  WWW\n}'
  );

  return (
    <Section title="Function">
      <form>
        <TextInput label="Name" name="name" placeholder="function name" />
        <TextInput label="Icon" name="icon" placeholder="1~3 char" />
        <TextInput label="Glob" name="glob" placeholder="(optional)" />
        <TextInput label="Color" name="color" placeholder="hex" />
        <CodeEditor code={code} setCode={setCode} />
      </form>
    </Section>
  );
}
