import React, {useCallback} from 'react';
import styled, {css} from 'styled-components';

type ButtonMode = 'default' | 'danger';

const primary = css`
  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    color: ${props => props.theme.color.primary};
    border-color: ${props => props.theme.color.primary};
    outline-color: ${p => p.theme.color.primary};
  }
`;

const danger = css`
  color: ${p => p.theme.color.danger};
  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    outline-color: ${p => p.theme.color.danger};
  }
`;

const ButtonStyle = styled.button<{mode?: ButtonMode}>`
  padding: ${props => props.theme.space[2]};
  background-color: transparent;
  border: solid 1px;
  border-radius: ${props => props.theme.space[1]};
  cursor: pointer;
  ${p => (p.mode === 'danger' ? danger : primary)};
`;

export const Button = (props: {
  mode?: ButtonMode;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  children?: React.ReactNode;
}) => {
  const onClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      props.onClick?.(event);
    },
    [props.onClick]
  );

  return (
    <ButtonStyle
      type="button"
      mode={props.mode}
      onClick={onClick as any}
      disabled={props.disabled}
    >
      {props.children}
    </ButtonStyle>
  );
};

export const ButtonIcon = styled.i`
  margin-right: ${p => p.theme.space[1]};
`;
