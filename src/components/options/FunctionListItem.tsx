import {useCallback} from 'react';

import {CopyFunction} from '../../lib/function';
import {FunctionItem, FunctionDisplay} from '../common/FunctionParts';
import {useDnDItem} from './DnD';
import {Editor} from './Editor';
import {Caret, DragKnob, EditorBox} from './FunctionItemParts';
import {DispatchType} from './FunctionsReducer';

import styles from './FunctionList.module.css';

export type FunctionListItemProps = {
  display: FunctionDisplay;
  index: number;
  draggable: boolean;
  /** The open draft, or undefined when this row's editor is closed. */
  editing?: CopyFunction;
  saving: boolean;
  saved: boolean;
  error?: string;
  dispatch: DispatchType;
  onOpen: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function FunctionListItem(props: FunctionListItemProps) {
  const {display, index, draggable, editing} = props;
  const {isDragging, ref, handleRef} = useDnDItem({
    id: display.id,
    index,
    canDrag: draggable,
  });

  const onEdit = useCallback(
    (fn: Omit<CopyFunction, 'id'>) => props.dispatch({t: 'edit', function: fn}),
    [props.dispatch],
  );
  const onCancel = useCallback(
    () => props.dispatch({t: 'cancel'}),
    [props.dispatch],
  );

  return (
    <div ref={ref}>
      <div
        className={[styles.functionItemBox, isDragging ? styles.dragging : '']
          .join(' ')
          .trim()}
      >
        <Caret active={!!editing} onClick={props.onOpen} />
        <FunctionItem fn={display} onClick={props.onOpen} />
        <div ref={handleRef}>
          <DragKnob draggable={draggable} />
        </div>
      </div>
      {editing && (
        <EditorBox>
          <Editor
            function={editing}
            onEdit={onEdit}
            onSave={props.onSave}
            onCancel={onCancel}
            onDelete={props.onDelete}
            saving={props.saving}
            saved={props.saved}
            error={props.error}
          />
        </EditorBox>
      )}
    </div>
  );
}
