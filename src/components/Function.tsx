import {h} from 'preact';
import {useCallback} from 'preact/hooks';
import styled from 'styled-components';

import {
  CopyFunction,
  CopyFunctionTheme,
  CopyFunctionWithTheme,
} from '../lib/function';

const FunctionWrap = styled.div<CopyFunctionTheme>`
  display: flex;
  flex-direction: row;
  width: 300px;
  padding: ${props => props.theme.space[2]};
  color: ${props => props.textColor};
  background-color: ${props => props.backgroundColor};
`;

const FunctionIcon = styled.span`
  width: 30px;
  font-family: 'monospace';
  font-weight: ${props => props.theme.font['semibold']};
  font-size: ${props => props.theme.size['xl']};
  margin-right: ${props => props.theme.space[1]};
`;

const FunctionName = styled.span``;

const Shortcut = styled.div``;

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  onClick: (fn: CopyFunction) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const {fn} = props;
  const onClick = useCallback(() => props.onClick(fn), [props]);
  return (
    <FunctionWrap {...fn.theme} onClick={onClick} tabIndex={-1}>
      <FunctionIcon>{fn.theme.icon.char}</FunctionIcon>
      <FunctionName>{fn.name}</FunctionName>
      <Shortcut></Shortcut>
    </FunctionWrap>
  );
}
