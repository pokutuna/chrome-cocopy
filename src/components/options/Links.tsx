import {h, Fragment} from 'preact';
import {Section} from '../options/Parts';

export function Links() {
  return (
    <Section title="Links">
      <ul>
        <li>
          <a href="#TODO">Chrome Web Store</a>
        </li>
        <li>
          <a href="https://github.com/pokutuna/chrome-cocopy">
            GitHub Repository
          </a>
        </li>
        <li>
          <a href="#TODO">Copyright notice</a>
        </li>
      </ul>
    </Section>
  );
}
