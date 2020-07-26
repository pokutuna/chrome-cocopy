import {h, VNode, ComponentChildren} from 'preact';
import {memo} from 'preact/compat';
import styled from 'styled-components';

export const MainColumn = styled.div`
  padding: 0;
  width: 700px;
  margin: 20px auto;
`;

const TitleIcon = styled.div`
  background: no-repeat center/contain url('img/logo.png');
  width: 123px;
  height: 60px;
`;

export const Title = memo(() => {
  return (
    <header>
      <TitleIcon />
    </header>
  );
});

const SectionTitleHeader = styled.h2`
  font-family: monospace;
  font-size: ${props => props.theme.size['2xl']};
`;

const SectionInner = styled.div`
  margin-left: ${props => props.theme.space[2]};
`;

export const Section = (props: {
  title: string;
  children?: ComponentChildren;
}) => (
  <div>
    <SectionTitleHeader>{props.title}</SectionTitleHeader>
    <SectionInner>{props.children}</SectionInner>
  </div>
);

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

const InputText = styled.input`
  padding: ${props => props.theme.space[1]};
  font-size: ${props => props.theme.size.lg};
`;

export const TextInput = (props: {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onInput?: (value: string) => void;
  sub?: VNode;
  pattern?: string;
}) => {
  return (
    <InputBox>
      <Label htmlFor={props.name}>
        {props.label}
        {props.sub && <LabelSub>{props.sub}</LabelSub>}
      </Label>
      <InputText
        type="text"
        id={props.name}
        name={props.name}
        placeholder={props.placeholder}
        pattern={props.pattern}
      />
    </InputBox>
  );
};

export const Box = styled.div`
  display: flex;
  flex-flow: column wrap;
`;

export const Item = styled.div<{grow?: number}>`
  display: flex;
  flex-grow: ${props => props.grow || 0};
`;

export const Row = styled.div`
  display: flex;
  flex-flow: row wrap;

  ${Item} + ${Item} {
    margin-left: ${props => props.theme.space[4]};
  }
`;

export const Button = styled.button<{color?: string}>`
  padding: ${props => props.theme.space[2]};
  background-color: transparent;
  border: solid 1px;
  border-radius: ${props => props.theme.space[1]};
`;
