import {h, Fragment, ComponentChildren} from 'preact';
import {memo} from 'preact/compat';
import styled from 'styled-components';

export const MainColumn = styled.div`
  padding: 0;
  width: 960px;
  margin: 20px auto;
`;

export const Rows = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

export const Columns = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const TitleIcon = styled.div`
  background: no-repeat center/contain url('img/logo.png');
  width: 123px;
  height: 60px;
`;

export const Title = memo(() => {
  const Header = Columns.withComponent('header');
  return (
    <Header>
      <TitleIcon />
    </Header>
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
  <Fragment>
    <SectionTitleHeader>{props.title}</SectionTitleHeader>
    <SectionInner>{props.children}</SectionInner>
  </Fragment>
);

export const InputBox = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.theme.space[2]};
`;

export const Label = styled.label`
  font-size: ${props => props.theme.size.xl};
  margin: ${props => props.theme.space[1]} 0;
`;

const InputText = styled.input`
  padding: ${props => props.theme.space[1]};
  font-size: ${props => props.theme.size.xl};
`;

export const TextInput = (props: {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onInput?: (value: string) => void;
}) => {
  return (
    <InputBox>
      <Label htmlFor={props.name}>{props.label}</Label>
      <InputText
        type="text"
        id={props.name}
        name={props.name}
        placeholder={props.placeholder}
      />
    </InputBox>
  );
};
