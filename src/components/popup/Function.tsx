import {h} from 'preact';
import {useCallback, useMemo} from 'preact/hooks';
import styled, {keyframes} from 'styled-components';

import {FunctionBox, FunctionName} from '../common/FunctionParts';
import {CopyFunctionTheme, CopyFunctionWithTheme} from '../../lib/function';
import {indexToKey} from '../../lib/util';

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

const Shortcut = styled.kbd<CopyFunctionTheme & {shortcut?: number}>`
  display: ${props =>
    typeof props.shortcut !== 'undefined' ? 'default' : 'none'};
  margin-left: auto;
  text-align: center;
  padding: 0 ${props => props.theme.space[1]};
  border-radius: ${props => props.theme.space[1]};
  border: 2px solid ${props => props.textColor};
  font-size: ${props => props.theme.size.lg};
  font-family: ${props => props.theme.fontFamily.monospace};
  box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
`;

function wrapKeyDown(cb: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cb();
  };
}

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  onClick: (fn: CopyFunctionWithTheme) => void;
  running: boolean;
  index: number;
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
      <FunctionName>{fn.name}</FunctionName>
      {shortcut && (
        <Shortcut {...fn.theme} shortcut={shortcut}>
          {shortcut}
        </Shortcut>
      )}
    </FunctionBoxWithAnimation>
  );
}
