import {useCallback, useMemo} from 'react';

import {EvalError} from '../../lib/eval';
import {CopyFunctionRef} from '../../lib/function-store/types';
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

type FunctionItemProps = {
  fn: CopyFunctionRef;
  index: number;
  running: boolean;
  error?: EvalError;
  onClick: (fn: CopyFunctionRef) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const {fn, index, running, error} = props;
  const shortcut = useMemo(() => indexToKey(index), [index]);
  const onClick = useCallback(() => props.onClick(fn), [props.onClick, fn]);
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onClick();
    },
    [onClick],
  );

  return (
    <FunctionBox
      className={running ? styles.running : styles.idle}
      $textColor={fn.theme.textColor}
      $backgroundColor={fn.theme.backgroundColor}
      onClick={onClick}
      onKeyDown={onKeyDown as any}
      // Intentional positive tabIndex: function items are tabbed first so the
      // settings gear comes last (tabIndex={0} would follow DOM order and put
      // the gear before the list). Do not "fix" to 0.
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
