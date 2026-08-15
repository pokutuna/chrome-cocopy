import {memo} from 'react';

import {useT} from '../common/I18nContext';
import {Section, TextList, ExternalLink} from './Parts';

// Each item leads with the code fragment and follows with a self-contained
// catalog sentence, so nothing translated wraps around markup
// (docs/i18n.md, "Nested Elements").
export const Hint = memo(() => {
  const t = useT();
  return (
    <Section title="Hints">
      <TextList>
        <li>{t.hints.singleFunction}</li>
        <li>
          <b>*BETA*</b>{' '}
          <code>
            {'{'}&quot;html&quot;:&quot;...&quot;,&quot;text&quot;:
            &quot;...&quot;{'}'}
          </code>
          {' — '}
          {t.hints.richText}
        </li>
        <li>
          <code>render(template, view)</code>
          {' — '}
          {t.hints.mustache} (
          <ExternalLink href="https://github.com/janl/mustache.js">
            mustache
          </ExternalLink>
          )
        </li>
        <li>
          <code>
            new DOMParser().parseFromString(content, &apos;text/html&apos;)
          </code>
          {' — '}
          {t.hints.domParser} (
          <ExternalLink href="https://developer.mozilla.org/docs/Web/API/DOMParser">
            <code>DOMParser</code>
          </ExternalLink>
          )
        </li>
        <li>
          <code>throw new Error(...)</code>
          {' — '}
          {t.hints.throwError}
        </li>
        <li>
          {t.hints.sandbox} (
          <ExternalLink href="https://developer.chrome.com/docs/extensions/how-to/security/sandboxing-eval">
            sandbox
          </ExternalLink>
          )
        </li>
        <li>
          {t.hints.gallery}{' '}
          <ExternalLink href="https://github.com/pokutuna/chrome-cocopy/blob/master/gallery/README.md">
            Function Gallery
          </ExternalLink>
        </li>
      </TextList>
    </Section>
  );
});

export const DebuggingHint = memo(() => {
  const t = useT();
  return (
    <Section title="Debugging">
      <TextList>
        <li>{t.hints.debugInspect}</li>
        <li>
          {t.hints.debugSources} <code>sandbox.html</code> &gt;{' '}
          <code>(no domain)</code>
        </li>
        <li>
          <code>debugger;</code>
          {' — '}
          {t.hints.debugStatement}
        </li>
      </TextList>
    </Section>
  );
});
