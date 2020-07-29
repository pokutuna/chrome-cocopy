import {h} from 'preact';
import {useEffect, useCallback, useRef, useReducer} from 'preact/hooks';
import styled from 'styled-components';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {FunctionItem} from '../common/FunctionParts';
import {DnDWrapper, useDnDItem} from './DnD';
import {Section} from './Parts';
import {Editor} from './Editor';
import {reducer, initialState, DispatchType} from './FunctionsReducer';

const FunctionBox = styled.div<{isDragging?: boolean}>`
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

const CaretBox = styled(ItemButton)`
  width: ${props => props.theme.size['4xl']};
  font-size: ${props => props.theme.size.xl};
`;

const Caret = (props: {active: boolean; onClick: () => void}) => {
  const {active, onClick} = props;
  return (
    <CaretBox onClick={onClick}>
      <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} />
    </CaretBox>
  );
};

const ItemBody = styled.div`
  width: ${props => props.theme.constants.popupWidth};
`;

const DragKnobBox = styled(ItemButton)<{draggable?: boolean}>`
  width: ${props => props.theme.size['4xl']};
  opacity: ${props => (props.draggable ? 1 : 0.3)};
  cursor: ${props => (props.draggable ? 'move' : 'default')};
`;

const DragKnob = (props: {draggable: boolean}) => {
  return (
    <DragKnobBox draggable={props.draggable}>
      <FontAwesomeIcon icon={faBars} />
    </DragKnobBox>
  );
};

const EditorBox = styled.div`
  margin-left: ${props => props.theme.size['4xl']};
  margin-bottom: ${props => props.theme.size['4xl']};
`;

type FunctionListItemProps = {
  fn: CopyFunctionWithTheme;
  index: number;
  active: boolean;
  draggable: boolean;
  dispatch: DispatchType;
};

function FunctionListItem(props: FunctionListItemProps) {
  const {fn, index, active, draggable, dispatch} = props;

  const ref = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (dragIndex: number, hoverIndex: number) =>
      dispatch({t: 'dragging', dragIndex, hoverIndex}),
    []
  );

  const onDropped = useCallback(() => dispatch({t: 'dropped'}), []);

  const onClick = useCallback(
    () => dispatch({t: 'select', functionId: fn.id}),
    [fn.id]
  );

  const {isDragging, drag} = useDnDItem({
    id: fn.id,
    index,
    ref,
    move,
    onDropped,
    canDrag: draggable,
  });

  return (
    <div ref={ref}>
      <FunctionBox isDragging={isDragging}>
        <Caret active={active} onClick={onClick} />
        <ItemBody>
          <FunctionItem fn={fn} onClick={onClick} />
        </ItemBody>
        <div ref={drag}>
          <DragKnob draggable={draggable} />
        </div>
      </FunctionBox>
      {active && (
        <EditorBox>
          <Editor function={fn} dispatch={dispatch} />
        </EditorBox>
      )}
    </div>
  );
}

export function FunctionList() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getCopyFunctions().then(functions => dispatch({t: 'init', functions}));
  }, []); // TODO refresh

  return (
    <Section title="Functions">
      <DnDWrapper>
        {state.functions.map((fn, idx) => (
          <FunctionListItem
            key={fn.id}
            index={idx}
            fn={fn.id === state.activeId ? state.editing! : fn}
            active={fn.id === state.activeId}
            draggable={state.draggable}
            dispatch={dispatch}
          />
        ))}
      </DnDWrapper>
    </Section>
  );
}
