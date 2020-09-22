import {h} from 'preact';
import {memo} from 'preact/compat';

import {Section, TextList} from './Parts';

export const Hint = memo(() => {
  return (
    <Section title="Hints">
      <TextList>
        <li>
          The code must be a single function that returns a string value to be
          copied.
        </li>
        <li>
          <code>render(template, view)</code> - You can render{' '}
          <a href="https://github.com/janl/mustache.js">mustache</a> templates.
        </li>
        <li>
          <code>
            new DOMParser().parseFromString(content, &apos;text/html&apos;)
          </code>
          - You can use{' '}
          <a href="https://developer.mozilla.org/docs/Web/API/DOMParser">
            <code>DOMParser</code>
          </a>{' '}
          to query the page document.
        </li>
        <li>
          To feedback an error, use <code>throw new Error(...)</code>. It will
          be displayed at the function that produced that.
        </li>
        <li>
          The code runs safely under the{' '}
          <a href="https://developer.chrome.com/apps/sandboxingEval">sandbox</a>
          , not under the page.
        </li>
      </TextList>
    </Section>
  );
});

export const DebuggingHint = memo(() => {
  return (
    <Section title="Debugging">
      <TextList>
        <li>
          To open the developer console by right clicking on the popup &amp;
          selecting &quot;Inspect&quot;
        </li>
        <li>
          You can find the code on the &quot;Sources&quot; panel, in{' '}
          <code>sandbox.html</code> &gt; <code>(no domain)</code> after
          executing it.
        </li>
        <li>
          You also can use <code>debugger;</code> in the code.
        </li>
      </TextList>
    </Section>
  );
});
