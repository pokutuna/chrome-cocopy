import {h} from 'preact';
import {memo} from 'preact/compat';
import {Section, TextList, ExternalLink} from '../options/Parts';

export const Links = memo(() => {
  return (
    <Section title="Links">
      <TextList>
        <li>
          <ExternalLink href="https://chrome.google.com/webstore/detail/cocopy/ihnfodlbkhgjnbheemjhkjfkfglgbdgc">
            Chrome Web Store
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://github.com/pokutuna/chrome-cocopy">
            GitHub Repository
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://github.com/pokutuna/chrome-cocopy/blob/master/gallery/README.md">
            Function Gallery
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="./licenses.txt">Copyright Notice</ExternalLink>
        </li>
      </TextList>
    </Section>
  );
});
