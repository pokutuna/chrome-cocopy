import {h} from 'preact';
import {memo} from 'preact/compat';

import {Section, TextList} from '../options/Parts';

export const DebuggingHint = memo(() => {
  return (
    <Section title="Debugging Hints">
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
