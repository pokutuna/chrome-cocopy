import {h} from 'preact';
import styled from 'styled-components';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog} from '@fortawesome/free-solid-svg-icons/faCog';

import {spin} from './Parts';

export const PopupWrapper = styled.div`
  width: 360px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const Title = styled.h1`
  margin: ${props => props.theme.space[2]};
  padding: 0 ${props => props.theme.space[2]};
  border-top: ${props => props.theme.size[2]} solid teal;
  border-bottom: ${props => props.theme.size[2]} solid teal;
`;

const OptionLink = styled.a`
  position: absolute;
  right: 0;
  font-size: ${props => props.theme.size.xl};
  margin-right: ${props => props.theme.space[4]};
  &:hover,
  &:focus {
    animation: ${spin} 1.5s linear infinite;
  }
`;

export function PopupHeader() {
  return (
    <Header>
      <Title>COCOPY!</Title>
      <OptionLink href="options.html" target="_blank">
        <FontAwesomeIcon icon={faCog} />
      </OptionLink>
    </Header>
  );
}
