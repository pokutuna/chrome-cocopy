import {h} from 'preact';
import {memo} from 'preact/compat';
import {Section, TextList} from '../options/Parts';

export const Links = memo(() => {
  return (
    <Section title="Links">
      <TextList>
        <li>
          <a href="#TODO" target="_blank" rel="noreferrer noopener">
            Chrome Web Store
          </a>
        </li>
        <li>
          <a
            href="https://github.com/pokutuna/chrome-cocopy"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub Repository
          </a>
        </li>
        <li>
          <a href="#TODO" target="_blank" rel="noreferrer noopener">
            Copyright Notice
          </a>
        </li>
      </TextList>
    </Section>
  );
});
