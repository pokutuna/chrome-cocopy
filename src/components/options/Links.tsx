import {h} from 'preact';
import {Section} from '../options/Parts';

export function Links() {
  return (
    <Section title="Links">
      <ul>
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
            Copyright notice
          </a>
        </li>
      </ul>
    </Section>
  );
}
