import {h, ComponentChildren} from 'preact';
import {useCallback, Ref} from 'preact/hooks';

import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';

export function DnDWrapper(props: {children: ComponentChildren}) {
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
  ref: Ref<HTMLElement>;
  move: (dragIndex: number, hoverIndex: number) => void;
  canDrag?: (monitor: any) => boolean;
  onDropped?: (item: DragItem) => void;
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

  const [{isDragging}, drag, dragPreview] = useDrag({
    item: {type, id, index},
    collect,
    canDrag: canDrag,
  });

  dragPreview(drop(ref));

  return {
    isDragging,
    drag,
  };
}
