import {h} from 'preact';
import {useCallback, useMemo} from 'preact/hooks';
import styled, {keyframes} from 'styled-components';

import {Shortcut, FunctionBox, FunctionName} from '../common/FunctionParts';
import {CopyFunctionTheme, CopyFunctionWithTheme} from '../../lib/function';
import {indexToKey} from '../../lib/util';
import {EvaluateResult} from '../../lib/eval';

const scanning = keyframes`
  0% { background-position: 100% }
  50% { background-position: 50% }
  100% { background-position: 0% }
`;

const FunctionBoxWithAnimation = styled(FunctionBox)<
  CopyFunctionTheme & {running: boolean}
>`
  animation-name: ${props => (props.running ? scanning : 'none')};
  animation-duration: 0.3s;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  background-size: 300% 100%;
  background-position: 0%;
  background-image: linear-gradient(
    90deg,
    ${props => props.backgroundColor} 0%,
    ${props => props.backgroundColor} 35%,
    ${props => props.textColor} 60%,
    ${props => props.backgroundColor} 60%,
    ${props => props.backgroundColor} 100%
  );
`;

function wrapKeyDown(cb: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cb();
  };
}

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  index: number;
  running: boolean;
  error?: EvaluateResult['error'];
  onClick: (fn: CopyFunctionWithTheme) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const {fn} = props;
  const shortcut = useMemo(() => indexToKey(props.index), [props.index]);
  const onClick = useCallback(() => props.onClick(fn), [props]);
  const onKeyDown = useCallback(wrapKeyDown(onClick), [onClick]);

  return (
    <FunctionBoxWithAnimation
      {...fn.theme}
      onClick={onClick}
      running={props.running}
      onKeyDown={onKeyDown as any}
      tabIndex={1}
    >
      <Shortcut textColor={fn.theme.textColor} shortcut={shortcut} />
      <FunctionName>{fn.name}</FunctionName>
    </FunctionBoxWithAnimation>
  );
}
