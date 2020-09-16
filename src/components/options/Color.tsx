import {h} from 'preact';
import {useCallback, useEffect, useRef} from 'preact/hooks';

import {random} from 'chroma-js';

import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPalette} from '@fortawesome/free-solid-svg-icons/faPalette';
import {faRandom} from '@fortawesome/free-solid-svg-icons/faRandom';

import {theme} from '../common/Theme';
import {InputBox, Label, Input} from './Input';

const palette = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FFC107',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
];

const InputWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ColorPickerBox = styled.div`
  position: relative;
  margin-left: -${props => props.theme.size['2xl']};
  font-size: ${props => props.theme.size.lg};
  cursor: pointer;
`;

const PaletteBox = styled.div`
  position: absolute;
  z-index: 999;
  background-color: #fff;

  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  width: 130px;
  margin-top: ${props => props.theme.space[2]};
  padding: ${props => props.theme.space[1]};
  border: 1px solid ${props => props.theme.color.gray};
`;

const PaletteColorBox = styled.div<{color: string}>`
  background-color: ${props => props.color};
  width: ${props => props.theme.size['2xl']};
  height: ${props => props.theme.size['2xl']};
  margin: ${props => props.theme.space[1]};
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const PaletteColor = (props: {
  color: string;
  onClick: (color: string) => void;
}) => {
  const onClick = useCallback(() => props.onClick(props.color), [
    props.onClick,
    props.color,
  ]);
  return <PaletteColorBox color={props.color} onClick={onClick} />;
};

const PaletteColorRandom = (props: {onClick: (color: string) => void}) => {
  const onClick = useCallback(() => props.onClick(random().hex()), [
    props.onClick,
  ]);
  return (
    <PaletteColorBox color="transparent" onClick={onClick}>
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
      if (props.show && !ref.current.contains(event.target as Node)) {
        props.togglePalette();
      }
    };
    document.body.addEventListener('click', onClickBody);
    return () => document.body.removeEventListener('click', onClickBody);
  }, [props.show, props.togglePalette]);

  return (
    <ColorPickerBox>
      <FontAwesomeIcon
        icon={faPalette}
        onClick={props.togglePalette}
        color={props.show ? theme.color.primary : undefined}
      />
      {props.show && (
        <PaletteBox ref={ref}>
          {palette.map(c => (
            <PaletteColor key={c} color={c} onClick={props.onSelect} />
          ))}
          <PaletteColorRandom onClick={props.onSelect} />
        </PaletteBox>
      )}
    </ColorPickerBox>
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
        (event.currentTarget as HTMLInputElement).value
      ),
    [props.onInput]
  );

  const onSelect = useCallback(
    (value: string) => props.onInput?.('backgroundColor', value),
    [props.onInput]
  );

  return (
    <InputBox>
      <Label htmlFor="color">Color</Label>
      <InputWrap>
        <Input
          type="text"
          value={props.value}
          onInput={onInput as any}
          id="color"
          name="color"
          placeholder="#F0F0F0"
          pattern="#([0-9A-F]{3}|[0-9A-F]{6})"
          maxLength={7}
          error={props.error}
        />
        <ColorPicker
          show={props.showPalette}
          onSelect={onSelect}
          togglePalette={props.togglePalette}
        />
      </InputWrap>
    </InputBox>
  );
}
