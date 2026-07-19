import React, {useCallback} from 'react';

import styles from './Input.module.css';

export const InputBox = (props: {children?: React.ReactNode}) => (
  <div className={styles.inputBox}>{props.children}</div>
);

export const Label = (props: {
  htmlFor?: string;
  children?: React.ReactNode;
}) => (
  <label className={styles.label} htmlFor={props.htmlFor}>
    {props.children}
  </label>
);

export const LabelSub = (props: {children?: React.ReactNode}) => (
  <span className={styles.labelSub}>{props.children}</span>
);

export const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    $error?: boolean;
  }
>(function Input(props, ref) {
  const {$error, ...rest} = props;
  return (
    <input
      ref={ref}
      className={[styles.input, $error ? styles.error : ''].join(' ').trim()}
      {...rest}
    />
  );
});

export const ErrorMessage = (props: {children?: React.ReactNode}) => (
  <span className={styles.errorMessage}>{props.children}</span>
);

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
        (event.currentTarget as HTMLInputElement).value,
      ),
    [props.name, props.onInput],
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
        $error={!!props.error}
      />
      {props.error && <ErrorMessage>{props.error}</ErrorMessage>}
    </InputBox>
  );
};
