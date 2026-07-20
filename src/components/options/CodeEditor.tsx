import {javascript, javascriptLanguage} from '@codemirror/lang-javascript';
import CodeMirror, {EditorView} from '@uiw/react-codemirror';
import {useCallback} from 'react';

import {theme} from '../common/Theme';
import {
  additionalCompletionKeymap,
  cocopyCompletionSource,
  javascriptCompletionSource,
} from './completions';
import {InputBox, Label, LabelSub, ErrorMessage} from './Input';

import './code.css';

const editorId = 'code';

const editorExtensions = [
  additionalCompletionKeymap,
  javascript(),
  javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
  javascriptLanguage.data.of({
    autocomplete: javascriptCompletionSource,
  }),
  EditorView.theme({
    '&': {
      backgroundColor: theme.color.codeBg,
      fontFamily: theme.fontFamily.monospace,
      fontSize: theme.size.base,
    },
    '.cm-content': {
      padding: theme.space[2],
    },
    '.cm-line': {
      padding: 0,
    },
    '.cm-scroller': {
      fontFamily: theme.fontFamily.monospace,
    },
  }),
];

export const CodeEditor = (props: {
  code: string;
  setCode: (code: string) => void;
  error?: string;
}) => {
  const onCreateEditor = useCallback((view: EditorView) => {
    view.contentDOM.id = editorId;
    view.contentDOM.spellcheck = false;
  }, []);

  return (
    <InputBox>
      <Label htmlFor="code">
        Code
        <LabelSub>Must be a single function.</LabelSub>
      </Label>
      <CodeMirror
        value={props.code}
        onChange={props.setCode}
        onCreateEditor={onCreateEditor}
        extensions={editorExtensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLineGutter: false,
        }}
        theme="none"
        aria-label="Code"
      />
      <ErrorMessage>{props.error}</ErrorMessage>
    </InputBox>
  );
};
