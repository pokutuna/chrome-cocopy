import {h} from 'preact';
import {useCallback, useMemo} from 'preact/hooks';
import styled, {css, keyframes} from 'styled-components';

import {CopyFunction} from '../../lib/function';
import {indexToKey} from '../../lib/util';
import {EvalError} from '../../lib/eval';
import {
  Shortcut,
  FunctionBox,
  FunctionName,
  RigthIconBox,
} from '../common/FunctionParts';
import {PatternIcon} from '../common/Icon';
import {FunctionError} from './Error';

function wrapKeyDown(cb: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cb();
  };
}

const scanning = keyframes`
  0% { background-position: 100% }
  50% { background-position: 50% }
  100% { background-position: 0% }
`;

const execAnimation = css<CopyFunction['theme']>`
  animation-name: ${scanning};
  animation-duration: 0.3s;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  background-size: 300% 100%;
  background-position: 0%;
  background-image: linear-gradient(
    90deg,
    ${p => p.backgroundColor} 0%,
    ${p => p.backgroundColor} 35%,
    ${p => p.textColor} 60%,
    ${p => p.backgroundColor} 60%,
    ${p => p.backgroundColor} 100%
  );
`;

// XXX sometime scanning animation stops accidentally.
// GPU & CSS animation problem? I met this when using this ext on sub display.
const cancelAnimation = css<CopyFunction['theme']>`
  animation-name: none !important;
  background-color: ${p => p.backgroundColor};
  background-image: none;
  background-position: 0% !important;
`;

const FunctionBoxWithAnimation = styled(FunctionBox)<
  CopyFunction['theme'] & {running: boolean}
>`
  ${p => (p.running ? execAnimation : cancelAnimation)};
`;

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
    <FunctionBoxWithAnimation
      {...fn.theme}
      onClick={onClick}
      running={running}
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
        <RigthIconBox color={props.fn.theme.textColor}>
          <PatternIcon />
        </RigthIconBox>
      )}
    </FunctionBoxWithAnimation>
  );
}
