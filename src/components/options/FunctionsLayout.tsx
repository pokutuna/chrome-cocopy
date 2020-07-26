import {h} from 'preact';
import styled from 'styled-components';

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

export const ItemLeft = styled(ItemButton)`
  width: ${props => props.theme.size['4xl']};
  font-size: ${props => props.theme.size.xl};
`;

export const ItemBody = styled.div`
  width: ${props => props.theme.constants.popupWidth};
`;

export const ItemRight = styled(ItemButton)`
  width: ${props => props.theme.size['4xl']};
  cursor: grab;
`;

export const EditorBox = styled.div`
  margin-left: ${props => props.theme.size['4xl']};
  margin-bottom: ${props => props.theme.size['4xl']};
`;
