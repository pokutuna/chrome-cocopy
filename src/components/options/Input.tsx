import React, {useCallback} from 'react';

import styled from 'styled-components';

export const InputBox = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: ${props => props.theme.space[2]};
  border-radius: ${props => props.theme.space[1]};
`;

export const Label = styled.label`
  font-size: ${props => props.theme.size.lg};
  margin: ${props => props.theme.space[2]} 0;
  display: flex;
`;

export const LabelSub = styled.span`
  margin-left: ${props => props.theme.space[2]};
  font-size: ${props => props.theme.size.sm};
  align-self: flex-end;
  color: ${props => props.theme.color.gray};
`;

export const Input = styled.input<{error?: boolean}>`
  padding: ${props => props.theme.space[1]};
  font-size: ${props => props.theme.size.lg};
  width: 100%;
  border: 1px solid;

  border-color: ${p => (p.error ? p.theme.color.error : 'inherit')};
  &:focus {
    ${p => p.error && `outline-color: ${p.theme.color.error}`};
  }
`;

export const ErrorMessage = styled.span`
  color: ${p => p.theme.color.error};
  margin-left: ${p => p.theme.space[1]};
`;

export const TextInput = (props: {
  label: string;
  name: string;
  placeholder?: string;
  pattern?: string;
  value: string;
  onInput?: (name: string, value: string) => void;
  subLabel?: React.ReactNode;
  error?: string;
}) => {
  const handleInput = useCallback(
    (event: InputEvent) =>
      props.onInput?.(
        props.name,
        (event.currentTarget as HTMLInputElement).value
      ),
    [props.name, props.onInput]
  );

  return (
    <InputBox>
      <Label htmlFor={props.name}>
        {props.label}
        {props.subLabel && <LabelSub>{props.subLabel}</LabelSub>}
      </Label>
      <Input
        type="text"
        value={props.value}
        onInput={handleInput as any}
        id={props.name}
        name={props.name}
        placeholder={props.placeholder}
        pattern={props.pattern}
        error={!!props.error}
      />
      {props.error && <ErrorMessage>{props.error}</ErrorMessage>}
    </InputBox>
  );
};
