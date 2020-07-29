import {h} from 'preact';
import {useEffect, useCallback, useRef, useReducer} from 'preact/hooks';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {FunctionItem} from '../common/FunctionParts';
import {DnDWrapper, useDnDItem} from './DnD';
import {Section} from './Parts';
import {Editor} from './Editor';
import {
  FunctionBox,
  Caret,
  ItemBody,
  DragKnob,
  EditorBox,
} from './FunctionsLayout';
import {reducer, initialState, DispatchType} from './FunctionsReducer';

type FunctionEditItemProps = {
  fn: CopyFunctionWithTheme;
  index: number;
  active: boolean;
  draggable: boolean;
  dispatch: DispatchType;
};

function FunctionEditItem(props: FunctionEditItemProps) {
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
          <Editor function={fn} fnDispatch={dispatch} />
        </EditorBox>
      )}
    </div>
  );
}

export function Functions() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getCopyFunctions().then(functions => dispatch({t: 'init', functions}));
  }, []); // TODO refresh

  return (
    <Section title="Functions">
      <DnDWrapper>
        {state.functions.map((fn, idx) => (
          <FunctionEditItem
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
