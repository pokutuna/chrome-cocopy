import {h} from 'preact';
import {useCallback} from 'preact/hooks';
import styled from 'styled-components';

import {CopyFunctionTheme, CopyFunctionWithTheme} from '../../lib/function';

export const FunctionBox = styled.div<CopyFunctionTheme>`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: ${props => props.theme.constants.functionHeight};
  padding: ${props => props.theme.space[1]} ${props => props.theme.space[2]};
  color: ${props => props.textColor};
  background-color: ${props => props.backgroundColor};
  &:focus,
  &:hover {
    filter: brightness(110%);
  }
`;

const ShortcutBox = styled.div`
  width: 32px;
`;

const ShortcutKey = styled.kbd<{textColor: string}>`
  text-align: center;
  padding: 0 ${props => props.theme.space[1]};
  margin-right: ${props => props.theme.space[2]};
  font-size: ${props => props.theme.size.lg};
  font-family: ${props => props.theme.fontFamily.monospace};

  border-radius: ${props => props.theme.space[1]};
  border: 2px solid ${props => props.textColor};
  box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
`;

type ShortcutProps = {
  textColor: string;
  shortcut?: number;
};

export function Shortcut(props: ShortcutProps) {
  return typeof props.shortcut !== 'undefined' ? (
    <ShortcutBox>
      <ShortcutKey textColor={props.textColor}>{props.shortcut}</ShortcutKey>
    </ShortcutBox>
  ) : (
    <ShortcutBox />
  );
}

export const FunctionName = styled.div`
  font-size: ${props => props.theme.size.base};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none; /* prevent accidental selection for form */
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
      <ShortcutBox />
      <FunctionName>{props.fn.name}</FunctionName>
    </FunctionBox>
  );
}
