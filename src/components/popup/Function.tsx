import {useCallback, useMemo} from 'react';

import {EvalError} from '../../lib/eval';
import {CopyFunction} from '../../lib/function';
import {indexToKey} from '../../lib/util';
import {
  Shortcut,
  FunctionBox,
  FunctionName,
  RigthIconBox,
} from '../common/FunctionParts';
import {PatternIcon} from '../common/Icon';
import {FunctionError} from './Error';

import styles from './Function.module.css';

function wrapKeyDown(cb: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cb();
  };
}

type FunctionItemProps = {
  fn: CopyFunction;
  index: number;
  running: boolean;
  error?: EvalError;
  onClick: (fn: CopyFunction) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const {fn, index, running, error} = props;
  const shortcut = useMemo(() => indexToKey(index), [index]);
  const onClick = useCallback(() => props.onClick(fn), [props.onClick, fn]);
  const onKeyDown = useCallback(wrapKeyDown(onClick), [onClick]);

  return (
    <FunctionBox
      className={running ? styles.running : styles.idle}
      $textColor={fn.theme.textColor}
      $backgroundColor={fn.theme.backgroundColor}
      onClick={onClick}
      onKeyDown={onKeyDown as any}
      tabIndex={1}
    >
      <Shortcut textColor={fn.theme.textColor} shortcut={shortcut} />

      {!error ? (
        <FunctionName>{fn.name}</FunctionName>
      ) : (
        <FunctionError error={error} />
      )}

      {props.fn.pattern && (
        <RigthIconBox $color={props.fn.theme.textColor}>
          <PatternIcon />
        </RigthIconBox>
      )}
    </FunctionBox>
  );
}
