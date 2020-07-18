import {h} from 'preact';
import styled from 'styled-components';

export const PopupWrapper = styled.div``;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Title = styled.h1`
  margin: ${props => props.theme.space[2]};
  padding: 0 ${props => props.theme.space[2]};
  border-top: ${props => props.theme.size[2]} solid teal;
  border-bottom: ${props => props.theme.size[2]} solid teal;
`;

export function PopupHeader() {
  return (
    <Header>
      <Title>COCOPY!</Title>
      <a href="options.html" target="_blank">
        settings
      </a>
    </Header>
  );
}
