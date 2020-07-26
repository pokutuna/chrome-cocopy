import {h} from 'preact';
import {useState, useEffect, useCallback, useRef} from 'preact/hooks';
import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';

import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {Section} from '../options/Parts';
import {FunctionItem} from '../Function';

const type = 'function';
interface DragItem {
  index: number;
  id: string;
  type: string;
}

const Box = styled.div<{isDragging?: boolean}>`
  opacity: ${props => (props.isDragging ? 0.5 : 1)};
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ItemLeft = styled.div``;
const ItemBody = styled.div`
  width: ${props => props.theme.constants.popupWidth};
`;
const ItemRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.theme.size['4xl']};
  height: ${props => props.theme.constants.functionHeight};
  cursor: grab;
`;

type FunctionEditItemProps = {
  fn: CopyFunctionWithTheme;
  onClick: () => void;
  active: boolean;
  index: number;
  move: (dragIndex: number, hoverIndex: number) => void;
};

function FunctionEditItem(props: FunctionEditItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: type,
    hover(item: DragItem) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = props.index;
      if (dragIndex === hoverIndex) return;
      props.move(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{isDragging}, drag, dragPreview] = useDrag({
    item: {type, id: props.fn.id, index: props.index},
    collect: (monitor: any) => ({isDragging: monitor.isDragging()}),
  });

  dragPreview(drop(ref));

  return (
    <Box ref={ref} isDragging={isDragging}>
      <ItemLeft />
      <ItemBody>
        <FunctionItem
          fn={props.fn}
          index={10} // XXX hide shortcut
          onClick={props.onClick}
          running={false}
        />
      </ItemBody>
      <ItemRight ref={drag}>
        <FontAwesomeIcon icon={faBars} />
      </ItemRight>
    </Box>
  );
}

export function Functions() {
  const [active, setActive] = useState<number | undefined>(0);
  const [functions, setFunctions] = useState<CopyFunctionWithTheme[]>([]);

  const move = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      console.log(dragIndex, hoverIndex);
      const fs = [...functions];
      const [dragging] = fs.splice(dragIndex, 1);
      fs.splice(hoverIndex, 0, dragging);
      setFunctions(fs);
    },
    [functions]
  );

  useEffect(() => {
    getCopyFunctions().then(setFunctions);
  }, []); // TODO refresh

  return (
    <Section title="Function">
      <DndProvider backend={HTML5Backend}>
        {functions.map((fn, idx) => (
          <FunctionEditItem
            key={fn.id}
            fn={fn}
            active={idx === active}
            onClick={() => setActive(idx)}
            index={idx}
            move={move}
          />
        ))}
      </DndProvider>
    </Section>
  );
}
