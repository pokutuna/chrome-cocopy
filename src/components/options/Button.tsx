import React, {useCallback} from 'react';

import styles from './Button.module.css';

type ButtonMode = 'default' | 'danger';

export const Button = (props: {
  mode?: ButtonMode;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  children?: React.ReactNode;
}) => {
  const onClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      props.onClick?.(event);
    },
    [props.onClick],
  );

  const modeClass = props.mode === 'danger' ? styles.danger : styles.primary;

  return (
    <button
      type="button"
      className={[styles.button, modeClass].join(' ')}
      onClick={onClick as any}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
};

export const ButtonIcon = (props: {children?: React.ReactNode}) => (
  <i className={styles.buttonIcon}>{props.children}</i>
);
