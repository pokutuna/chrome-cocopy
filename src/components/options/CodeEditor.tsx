import {useCallback, useEffect} from 'react';

import {default as SimpleCodeEditor} from 'react-simple-code-editor';
import {highlight as hl, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

import {theme} from '../common/Theme';
import {InputBox, Label, LabelSub, ErrorMessage} from './Input';

import './code.css';

const textareaId = 'code';

export const CodeEditor = (props: {
  code: string;
  setCode: (code: string) => void;
  error?: string;
}) => {
  const highlight = useCallback((code: string) => {
    const result = hl(code, languages.js);
    return result;
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const textarea = document.getElementById(textareaId);
      if (textarea) textarea.spellcheck = false;
    }, 50);
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
        textareaId={textareaId}
        style={{
          fontSize: theme.size.base,
          fontFamily: theme.fontFamily.monospace,
          backgroundColor: theme.color.codeBg,
        }}
        textareaClassName="editor-additional-styles"
        preClassName="editor-additional-styles"
      />
      <ErrorMessage>{props.error}</ErrorMessage>
    </InputBox>
  );
};
