import React, {memo, useMemo} from 'react';
import {Link} from 'react-router-dom';

import {isDev} from '../../lib/util';

import styles from './Parts.module.css';

export const MainColumn = (props: {children?: React.ReactNode}) => (
  <div className={styles.mainColumn}>{props.children}</div>
);

export const Title = memo(() => {
  const dev = useMemo(() => isDev(), []);

  return (
    <header>
      <Link to="/">
        <div
          className={[styles.titleIcon, dev ? styles.dev : ''].join(' ').trim()}
          role="img"
          aria-label="cocopy"
        />
      </Link>
    </header>
  );
});

export const Section = (props: {title: string; children?: React.ReactNode}) => (
  <div className={styles.sectionBox}>
    <h2 className={styles.sectionTitleHeader}>{props.title}</h2>
    <div className={styles.sectionInner}>{props.children}</div>
  </div>
);

export const TextList = (props: {children?: React.ReactNode}) => (
  <ul className={styles.textList}>{props.children}</ul>
);

export const Box = (props: {children?: React.ReactNode}) => (
  <div className={styles.box}>{props.children}</div>
);

export const Item = (props: {
  $grow?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => (
  <div
    className={styles.item}
    style={
      {
        ...props.style,
        '--item-grow': props.$grow ?? 0,
      } as React.CSSProperties
    }
  >
    {props.children}
  </div>
);

// Replaces styled-components' `${Item} + ${Item}` component selector with a
// `gap` on the flex row (see Parts.module.css .row) — no CSS Modules
// equivalent exists for generated-class adjacency selectors.
export const Row = (props: {children?: React.ReactNode}) => (
  <div className={styles.row}>{props.children}</div>
);

export const DividerH = () => <div className={styles.dividerH} />;

export const DividerV = () => <div className={styles.dividerV} />;

export const ExternalLink = (props: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <a href={props.href} target="_blank" rel="noreferrer noopener">
      {props.children}
    </a>
  );
};

export const VersionLabel = () => {
  const label = useMemo(() => chrome.runtime.getManifest()?.version_name, []);
  return <div className={styles.center}>{label}</div>;
};
