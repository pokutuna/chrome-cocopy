import {DragDropProvider} from '@dnd-kit/react';
import {isSortable, useSortable} from '@dnd-kit/react/sortable';
import React from 'react';

type DnDWrapperProps = {
  children: React.ReactNode;
  move: (dragIndex: number, hoverIndex: number) => void;
  onDropped: () => void;
};

export function DnDWrapper(props: DnDWrapperProps) {
  return (
    <DragDropProvider
      onDragEnd={event => {
        if (event.canceled) return;

        const {source} = event.operation;
        if (
          !isSortable(source) ||
          typeof source.initialIndex !== 'number' ||
          typeof source.index !== 'number' ||
          source.initialIndex === source.index
        ) {
          return;
        }

        props.move(source.initialIndex, source.index);
        props.onDropped();
      }}
    >
      {props.children}
    </DragDropProvider>
  );
}

type DnDItemArgs = {
  id: string;
  index: number;
  canDrag?: boolean;
};

export function useDnDItem(props: DnDItemArgs) {
  return useSortable({
    id: props.id,
    index: props.index,
    disabled: {
      draggable: props.canDrag === false,
      droppable: props.index < 0,
    },
  });
}
