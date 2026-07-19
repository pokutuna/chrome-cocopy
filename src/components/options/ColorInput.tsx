import {faPalette} from '@fortawesome/free-solid-svg-icons/faPalette';
import {faRandom} from '@fortawesome/free-solid-svg-icons/faRandom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import chroma from 'chroma-js';
import React, {useCallback, useEffect, useRef} from 'react';

import {colorPalette} from '../../lib/function';
import {InputBox, Label, Input} from './Input';

import styles from './ColorInput.module.css';

const PaletteColorBox = (props: {
  $color: string;
  onClick: () => void;
  children?: React.ReactNode;
}) => (
  <div
    className={styles.paletteColorBox}
    style={{'--palette-color': props.$color} as React.CSSProperties}
    onClick={props.onClick}
  >
    {props.children}
  </div>
);

const PaletteColor = (props: {
  color: string;
  onClick: (color: string) => void;
}) => {
  const onClick = useCallback(
    () => props.onClick(props.color),
    [props.onClick, props.color],
  );
  return <PaletteColorBox $color={props.color} onClick={onClick} />;
};

const PaletteColorRandom = (props: {onClick: (color: string) => void}) => {
  const onClick = useCallback(
    () => props.onClick(chroma.random().hex()),
    [props.onClick],
  );
  return (
    <PaletteColorBox $color="transparent" onClick={onClick}>
      <FontAwesomeIcon icon={faRandom} />
    </PaletteColorBox>
  );
};

type ColorPickerProps = {
  show: boolean;
  onSelect: (color: string) => void;
  togglePalette: () => void;
};

export function ColorPicker(props: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickBody = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        props.show &&
        !ref.current?.contains(event.target)
      ) {
        props.togglePalette();
      }
    };
    document.body.addEventListener('click', onClickBody);
    return () => document.body.removeEventListener('click', onClickBody);
  }, [props.show, props.togglePalette]);

  return (
    <div className={styles.colorPickerBox} ref={ref}>
      <FontAwesomeIcon
        icon={faPalette}
        onClick={props.togglePalette}
        color={props.show ? 'var(--color-primary)' : undefined}
        data-testid="toggle-palette"
      />
      {props.show && (
        <div className={styles.paletteBox} data-testid="palette">
          {colorPalette.map((c, i) => (
            <PaletteColor key={i} color={c} onClick={props.onSelect} />
          ))}
          <PaletteColorRandom onClick={props.onSelect} />
        </div>
      )}
    </div>
  );
}

type ColorInputProps = {
  value: string;
  error?: boolean;
  onInput: (name: string, value: string) => void;
  togglePalette: () => void;
  showPalette: boolean;
};

export function ColorInput(props: ColorInputProps) {
  const onInput = useCallback(
    (event: InputEvent) =>
      props.onInput?.(
        'backgroundColor',
        (event.currentTarget as HTMLInputElement).value,
      ),
    [props.onInput],
  );

  const onSelect = useCallback(
    (value: string) => props.onInput?.('backgroundColor', value),
    [props.onInput],
  );

  return (
    <InputBox>
      <Label htmlFor="color">Color</Label>
      <div className={styles.inputWrap}>
        <Input
          type="text"
          value={props.value}
          onInput={onInput as any}
          id="color"
          name="color"
          placeholder="#F0F0F0"
          pattern="#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})"
          maxLength={7}
          $error={props.error}
        />
        <ColorPicker
          show={props.showPalette}
          onSelect={onSelect}
          togglePalette={props.togglePalette}
        />
      </div>
    </InputBox>
  );
}
