import {faCog} from '@fortawesome/free-solid-svg-icons/faCog';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useMemo} from 'react';

import {isDev} from '../../lib/util';

import styles from './Header.module.css';

export function PopupHeader() {
  const dev = useMemo(() => isDev(), []);
  return (
    <div className={styles.headerBox}>
      <div className={[styles.title, dev ? styles.dev : ''].join(' ').trim()} />
      <a className={styles.optionLink} href="/options.html" target="_blank">
        <FontAwesomeIcon icon={faCog} />
      </a>
    </div>
  );
}
