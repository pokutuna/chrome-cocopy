import {h} from 'preact';
import {useCallback} from 'preact/hooks';

import {default as SimpleCodeEditor} from 'react-simple-code-editor';
import {highlight as hl, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

import {theme} from '../common/Theme';
import {InputBox, Label, LabelSub} from './Input';

export const CodeEditor = (props: {
  code: string;
  setCode: (code: string) => void;
}) => {
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
