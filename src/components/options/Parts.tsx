import {h} from 'preact';
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

export const SectionTitle = memo((props: {title: string}) => (
  <SectionTitleHeader>{props.title}</SectionTitleHeader>
));
