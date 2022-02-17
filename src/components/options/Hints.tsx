import {h} from 'preact';
import {memo} from 'preact/compat';

import {Section, TextList, ExternalLink} from './Parts';

export const Hint = memo(() => {
  return (
    <Section title="Hints">
      <TextList>
        <li>
          The code must be a single function that returns a string value to
          copy.
        </li>
        <li>
          <b>*BETA*</b> Returning{' '}
          <code>
            {'{'}&quot;html&quot;:&quot;...&quot;,&quot;text&quot;:
            &quot;...&quot;{'}'}
          </code>{' '}
          to copy as rich text &amp; plain text. This interface may change in
          future.
        </li>
        <li>
          <code>render(template, view)</code> - You can render{' '}
          <ExternalLink href="https://github.com/janl/mustache.js">
            mustache
          </ExternalLink>{' '}
          templates.
        </li>
        <li>
          <code>
            new DOMParser().parseFromString(content, &apos;text/html&apos;)
          </code>
          - You can use{' '}
          <ExternalLink href="https://developer.mozilla.org/docs/Web/API/DOMParser">
            <code>DOMParser</code>
          </ExternalLink>{' '}
          to query the page document.
        </li>
        <li>
          To feedback an error, use <code>throw new Error(...)</code>. It will
          appear at the function that produced the error.
        </li>
        <li>
          The code runs safely under the{' '}
          <ExternalLink href="https://developer.chrome.com/apps/sandboxingEval">
            sandbox
          </ExternalLink>
          , not under the page.
        </li>
        <li>
          Visit{' '}
          <ExternalLink href="https://github.com/pokutuna/chrome-cocopy/blob/master/gallery/README.md">
            Function Gallery
          </ExternalLink>{' '}
          to find new function and see sample codes.
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
