import React, {useCallback} from 'react';

import {DndProvider, useDrag, useDrop, DropTargetMonitor} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';

export function DnDWrapper(props: {children: React.ReactNode}) {
  return <DndProvider backend={HTML5Backend}>{props.children}</DndProvider>;
}

const type = 'function';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

type DnDItemArgs = {
  id: string;
  index: number;
  ref: React.RefObject<HTMLElement>;
  move: (dragIndex: number, hoverIndex: number) => void;
  canDrag?: boolean;
  onDropped?: (item: DragItem, monitor: DropTargetMonitor) => void;
};

const collect = (monitor: any) => ({isDragging: monitor.isDragging()});

export function useDnDItem(props: DnDItemArgs) {
  const {id, index, ref, move, canDrag, onDropped} = props;

  const hover = useCallback(
    (item: DragItem) => {
      if (!props.ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      props.move(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    [ref, index, move]
  );
  const [, drop] = useDrop({
    accept: type,
    hover,
    drop: onDropped,
  });

  const [{isDragging}, drag, dragPreview] = useDrag(
    {
      type,
      item: {id, index},
      collect,
      canDrag,
    },
    [id, index, canDrag]
  );

  dragPreview(drop(ref));

  return {
    isDragging,
    drag,
  };
}
