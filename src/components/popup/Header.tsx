import {faCog} from '@fortawesome/free-solid-svg-icons/faCog';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useMemo} from 'react';

import {isDev} from '../../lib/util';

import styles from './Header.module.css';

export function PopupHeader() {
  const dev = useMemo(() => isDev(), []);
  return (
    <div className={styles.headerBox}>
      <div
        className={[styles.title, dev ? styles.dev : ''].join(' ').trim()}
        role="img"
        aria-label="cocopy"
      />
      <a
        className={styles.optionLink}
        href="/options.html"
        target="_blank"
        aria-label="Settings"
      >
        <FontAwesomeIcon icon={faCog} />
      </a>
    </div>
  );
}
