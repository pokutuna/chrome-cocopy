import {h} from 'preact';
import {useCallback} from 'preact/hooks';
import styled from 'styled-components';

import {
  CopyFunction,
  CopyFunctionTheme,
  CopyFunctionWithTheme,
} from '../lib/function';
import {charLength} from '../lib/util';

const FunctionWrap = styled.div<CopyFunctionTheme>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${props => props.theme.space[2]};
  color: ${props => props.textColor};
  background-color: ${props => props.backgroundColor};
  height: 36px;

  &:focus,
  &:hover {
    filter: brightness(110%);
  }
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

const Shortcut = styled.kbd<CopyFunctionTheme>`
  margin-left: auto;
  text-align: center;
  padding: 0 ${props => props.theme.space[1]};
  border-radius: ${props => props.theme.space[1]};
  border: 2px solid ${props => props.textColor};
  font: bold ${props => props.theme.size.lg} monospace;
  box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
`;

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  onClick: (fn: CopyFunction) => void;
};

function wrapKeyDown(cb: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') cb();
  };
}

export function FunctionItem(props: FunctionItemProps) {
  const {fn} = props;
  const onClick = useCallback(() => props.onClick(fn), [props]);
  const onKeyDown = useCallback(wrapKeyDown(onClick), [onClick]);

  return (
    <FunctionWrap
      {...fn.theme}
      onClick={onClick}
      onKeyDown={onKeyDown as any}
      tabIndex={1}
    >
      <FunctionIcon len={charLength(fn.theme.icon.char)}>
        {fn.theme.icon.char}
      </FunctionIcon>
      <FunctionName>{fn.name}</FunctionName>
      <Shortcut {...fn.theme}>1</Shortcut>
    </FunctionWrap>
  );
}
