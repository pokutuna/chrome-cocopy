import {h} from 'preact';
import {useCallback} from 'preact/hooks';

import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPalette} from '@fortawesome/free-solid-svg-icons/faPalette';

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
  '#212121',
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
  border: 1px solid ${props => props.theme.color.gray};
`;

const PaletteColorBox = styled.div<{color: string}>`
  background-color: ${props => props.color};
  width: ${props => props.theme.size['2xl']};
  height: ${props => props.theme.size['2xl']};
  margin: ${props => props.theme.space[1]};
  cursor: pointer;
`;

const PaletteColor = (props: {
  color: string;
  onClick: (color: string) => void;
}) => {
  return (
    <PaletteColorBox
      color={props.color}
      onClick={() => props.onClick(props.color)}
    />
  );
};

type ColorPickerProps = {
  show: boolean;
  onSelect: (color: string) => void;
  onClickPalette: () => void;
};

export function ColorPicker(props: ColorPickerProps) {
  return (
    <ColorPickerBox>
      <FontAwesomeIcon icon={faPalette} onClick={props.onClickPalette} />
      {props.show && (
        <PaletteBox>
          {palette.map(c => (
            <PaletteColor key={c} color={c} onClick={props.onSelect} />
          ))}
        </PaletteBox>
      )}
    </ColorPickerBox>
  );
}

type ColorInputProps = {
  value: string;
  onInput: (name: string, value: string) => void;
  onClickPalette: () => void;
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
          onInput={onInput}
          id="color"
          name="color"
          placeholder="#F0F0F0"
          pattern="#([0-9A-F]{3}|[0-9A-F]{6})"
          maxLength={7}
        />
        <ColorPicker
          show={props.showPalette}
          onSelect={onSelect}
          onClickPalette={props.onClickPalette}
        />
      </InputWrap>
    </InputBox>
  );
}
