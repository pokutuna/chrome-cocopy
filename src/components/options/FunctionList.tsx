import {h} from 'preact';
import {useEffect, useCallback, useRef, useReducer} from 'preact/hooks';
import styled from 'styled-components';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {FunctionItem, AddFunctionItem} from '../common/FunctionParts';
import {DnDWrapper, useDnDItem} from './DnD';
import {Section} from './Parts';
import {Editor} from './Editor';
import {reducer, initialState, DispatchType} from './FunctionsReducer';
import {useSubscribeFunctions} from './Subscribe';

const FunctionItemBox = styled.div<{isDragging?: boolean}>`
  opacity: ${props => (props.isDragging ? 0.5 : 1)};
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ItemButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.theme.size['4xl']};
  height: ${props => props.theme.constants.functionHeight};
  cursor: pointer;
`;

const Caret = (props: {active: boolean; onClick: () => void}) => {
  const {active, onClick} = props;
  return (
    <ItemButton onClick={onClick}>
      <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} size="lg" />
    </ItemButton>
  );
};

export const ItemBody = styled.div`
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

export const EditorBox = styled.div`
  margin-left: ${props => props.theme.size['4xl']};
  margin-bottom: ${props => props.theme.size['4xl']};
`;

const AddFunctionBox = styled.div`
  margin-top: ${props => props.theme.space[2]};
`;

function AddFunction(props: {onClick: () => void}) {
  return (
    <FunctionItemBox>
      <ItemButton onClick={props.onClick}>
        <FontAwesomeIcon icon={faPlus} />
      </ItemButton>
      <ItemBody>
        <AddFunctionItem onClick={props.onClick} />
      </ItemBody>
    </FunctionItemBox>
  );
}

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
      <FunctionItemBox isDragging={isDragging}>
        <Caret active={active} onClick={onClick} />
        <ItemBody>
          <FunctionItem fn={fn} onClick={onClick} />
        </ItemBody>
        <div ref={drag}>
          <DragKnob draggable={draggable} />
        </div>
      </FunctionItemBox>
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

  // load functions
  useEffect(() => {
    getCopyFunctions().then(functions => dispatch({t: 'init', functions}));
  }, [dispatch]);

  const onClickAdd = useCallback(() => dispatch({t: 'add'}), [dispatch]);

  // refresh when functions are updated with opening multiple options pages.
  const onUpdateFunctionsBackground = useCallback(
    (functions: CopyFunctionWithTheme[]) => dispatch({t: 'refresh', functions}),
    [dispatch]
  );
  useSubscribeFunctions(onUpdateFunctionsBackground);

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

        {/* New Function */}
        <AddFunctionBox>
          {state.activeId !== 'new' ? (
            <AddFunction onClick={onClickAdd} />
          ) : (
            <FunctionListItem
              index={-1}
              fn={state.editing!}
              active={true}
              draggable={false}
              dispatch={dispatch}
            />
          )}
        </AddFunctionBox>
      </DnDWrapper>
    </Section>
  );
}
