import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useEffect, useCallback, useRef, useReducer} from 'react';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunction} from '../../lib/function';
import {FunctionItem, AddFunctionItem} from '../common/FunctionParts';
import {DnDWrapper, useDnDItem} from './DnD';
import {Editor} from './Editor';
import {reducer, initialState, DispatchType} from './FunctionsReducer';
import {Section} from './Parts';
import {useSubscribeFunctions} from './Subscribe';

import styles from './FunctionList.module.css';

const Caret = (props: {active: boolean; onClick: () => void}) => {
  const {active, onClick} = props;
  return (
    <div className={styles.itemButton} onClick={onClick}>
      <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} size="lg" />
    </div>
  );
};

const DragKnob = (props: {draggable: boolean}) => {
  return (
    // dragKnobBox extends itemButton (was styled(ItemButton)); keep both
    // classes so the flex centering and size come from itemButton.
    <div
      className={[
        styles.itemButton,
        styles.dragKnobBox,
        props.draggable ? styles.draggable : '',
      ]
        .join(' ')
        .trim()}
    >
      <FontAwesomeIcon icon={faBars} />
    </div>
  );
};

export function EditorBox(props: {children?: React.ReactNode}) {
  return <div className={styles.editorBox}>{props.children}</div>;
}

function AddFunction(props: {onClick: () => void}) {
  return (
    <div className={styles.functionItemBox}>
      <div className={styles.itemButton} onClick={props.onClick}>
        <FontAwesomeIcon icon={faPlus} />
      </div>
      <AddFunctionItem onClick={props.onClick} />
    </div>
  );
}

type FunctionListItemProps = {
  fn: CopyFunction;
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
    [dispatch],
  );

  const onDropped = useCallback(() => dispatch({t: 'dropped'}), []);

  const onClick = useCallback(
    () => dispatch({t: 'select', functionId: fn.id}),
    [fn.id],
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
      <div
        className={[styles.functionItemBox, isDragging ? styles.dragging : '']
          .join(' ')
          .trim()}
      >
        <Caret active={active} onClick={onClick} />
        <FunctionItem fn={fn} onClick={onClick} />
        <div
          ref={node => {
            drag(node);
          }}
        >
          <DragKnob draggable={draggable} />
        </div>
      </div>
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
    (functions: CopyFunction[]) => dispatch({t: 'refresh', functions}),
    [dispatch],
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
        <div className={styles.addFunctionBox}>
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
        </div>
      </DnDWrapper>
    </Section>
  );
}
