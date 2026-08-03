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
  setCode?: (code: string) => void;
  error?: string;
  /** Render the same highlighted surface without accepting edits. */
  readOnly?: boolean;
}) => {
  const onCreateEditor = useCallback((view: EditorView) => {
    view.contentDOM.id = editorId;
    view.contentDOM.spellcheck = false;
  }, []);
  const readOnly = props.readOnly ?? false;

  return (
    <InputBox>
      <Label htmlFor={readOnly ? undefined : editorId}>
        Code
        {!readOnly && <LabelSub>Must be a single function.</LabelSub>}
      </Label>
      <CodeMirror
        value={props.code}
        onChange={props.setCode}
        // The fixed contentDOM id exists for the editable form's label; a
        // read-only viewer can appear several times on one page, so it must
        // not claim the id.
        onCreateEditor={readOnly ? undefined : onCreateEditor}
        editable={!readOnly}
        readOnly={readOnly}
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
