import {h} from 'preact';
import styled from 'styled-components';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';

export const FunctionBox = styled.div<{isDragging?: boolean}>`
  opacity: ${props => (props.isDragging ? 0.5 : 1)};
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ItemButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${props => props.theme.constants.functionHeight};
`;

export const ItemBody = styled.div`
  width: ${props => props.theme.constants.popupWidth};
`;

export const EditorBox = styled.div`
  margin-left: ${props => props.theme.size['4xl']};
  margin-bottom: ${props => props.theme.size['4xl']};
`;

const CaretBox = styled(ItemButton)`
  width: ${props => props.theme.size['4xl']};
  font-size: ${props => props.theme.size.xl};
`;

export const Caret = (props: {active: boolean; onClick: () => void}) => {
  const {active, onClick} = props;
  return (
    <CaretBox onClick={onClick}>
      <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} />
    </CaretBox>
  );
};

const DragKnobBox = styled(ItemButton)<{draggable?: boolean}>`
  width: ${props => props.theme.size['4xl']};
  opacity: ${props => (props.draggable ? 1 : 0.3)};
  cursor: ${props => (props.draggable ? 'move' : 'default')};
`;

export const DragKnob = (props: {draggable: boolean}) => {
  return (
    <DragKnobBox draggable={props.draggable}>
      <FontAwesomeIcon icon={faBars} />
    </DragKnobBox>
  );
};
