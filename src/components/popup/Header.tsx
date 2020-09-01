import {h} from 'preact';
import styled, {keyframes} from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog} from '@fortawesome/free-solid-svg-icons/faCog';

const HeaderBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const Title = styled.div`
  width: 84px;
  height: 40px;
  background: no-repeat center/contain url('img/logo.png');
  margin: ${props => props.theme.space[1]};
  padding: 0 ${props => props.theme.space[1]};
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const OptionLink = styled.a`
  position: absolute;
  right: 0;
  font-size: ${props => props.theme.size.xl};
  margin-right: ${props => props.theme.space[4]};
  color: #666;
  &:hover,
  &:focus {
    color: #333;
    animation: ${spin} 1.5s linear infinite;
  }
`;

export function PopupHeader() {
  return (
    <HeaderBox>
      <Title />
      <OptionLink href="/options.html" target="_blank">
        <FontAwesomeIcon icon={faCog} />
      </OptionLink>
    </HeaderBox>
  );
}
