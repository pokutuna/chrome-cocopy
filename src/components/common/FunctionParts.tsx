import {h} from 'preact';
import {useCallback} from 'preact/hooks';
import styled from 'styled-components';

import {CopyFunctionTheme, CopyFunctionWithTheme} from '../../lib/function';

export const FunctionBox = styled.div<CopyFunctionTheme>`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: ${props => props.theme.constants.functionHeight};
  padding: ${props => props.theme.space[1]};
  color: ${props => props.textColor};
  background-color: ${props => props.backgroundColor};
  &:focus,
  &:hover {
    filter: brightness(110%);
  }
`;

export const FunctionName = styled.div`
  font-size: ${props => props.theme.size.base};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  onClick?: (fn: CopyFunctionWithTheme) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const onClick = useCallback(() => props.onClick?.(props.fn), [
    props.onClick,
    props.fn,
  ]);
  return (
    <FunctionBox {...props.fn.theme} onClick={onClick} tabIndex={-1}>
      <FunctionName>{props.fn.name}</FunctionName>
    </FunctionBox>
  );
}
