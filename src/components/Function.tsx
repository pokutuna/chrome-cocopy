import {h} from 'preact';
import {useCallback, useMemo} from 'preact/hooks';
import styled, {keyframes} from 'styled-components';

import {
  CopyFunction,
  CopyFunctionTheme,
  CopyFunctionWithTheme,
} from '../lib/function';
import {charLength, indexToKey} from '../lib/util';

const syuuun = keyframes`
  0% { background-position: 100% }
  50% { background-position: 50% }
  100% { background-position: 0% }
`;

const FunctionWrap = styled.div<CopyFunctionTheme & {running: boolean}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 32px;
  padding: ${props => props.theme.space[2]};
  color: ${props => props.textColor};
  &:focus,
  &:hover {
    filter: brightness(110%);
  }

  animation-name: ${props => (props.running ? syuuun : 'none')};
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

const lenToSize: {[len: number]: string} = {
  1: '3xl',
  2: 'xl',
} as const;

const FunctionIcon = styled.div<{len: number}>`
  min-width: 30px;
  width: 30px;
  font-weight: ${props => props.theme.font['semibold']};
  font-family: monospace;
  font-size: ${props => props.theme.size[lenToSize[props.len] || 'base']};
  overflow: hidden;
  margin-right: ${props => props.theme.space[2]};
  text-align: center;
`;

const FunctionName = styled.div`
  font-size: ${props => props.theme.size.base};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Shortcut = styled.kbd<CopyFunctionTheme & {shortcut?: number}>`
  display: ${props => (props.shortcut ? 'default' : 'none')};
  margin-left: auto;
  text-align: center;
  padding: 0 ${props => props.theme.space[1]};
  border-radius: ${props => props.theme.space[1]};
  border: 2px solid ${props => props.textColor};
  font: bold ${props => props.theme.size.lg} monospace;
  box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
`;

function wrapKeyDown(cb: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cb();
  };
}

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  running: boolean;
  index: number;
  onClick: (fn: CopyFunction) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const {fn} = props;
  const shortcut = useMemo(() => indexToKey(props.index), [props.index]);
  const onClick = useCallback(() => props.onClick(fn), [props]);
  const onKeyDown = useCallback(wrapKeyDown(onClick), [onClick]);

  return (
    <FunctionWrap
      running={props.running}
      {...fn.theme}
      onClick={onClick}
      onKeyDown={onKeyDown as any}
      tabIndex={1}
    >
      <FunctionIcon len={charLength(fn.theme.icon.char)}>
        {fn.theme.icon.char}
      </FunctionIcon>
      <FunctionName>{fn.name}</FunctionName>
      <Shortcut {...fn.theme} shortcut={shortcut}>
        {shortcut}
      </Shortcut>
    </FunctionWrap>
  );
}
