import {h} from 'preact';
import {useState, useEffect, useCallback, useRef} from 'preact/hooks';
import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';

import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {FunctionItem} from '../Function';
import {Section} from '../options/Parts';
import {Editor} from '../options/Editor';

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

const ItemButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${props => props.theme.constants.functionHeight};
`;

const ItemLeft = styled(ItemButton)`
  width: ${props => props.theme.size['4xl']};
  font-size: ${props => props.theme.size.xl};
`;
const ItemBody = styled.div`
  width: ${props => props.theme.constants.popupWidth};
`;
const ItemRight = styled(ItemButton)`
  width: ${props => props.theme.size['4xl']};
  cursor: grab;
`;
const EditorBox = styled.div`
  margin-left: ${props => props.theme.size['4xl']};
`;

type FunctionEditItemProps = {
  fn: CopyFunctionWithTheme;
  onClick: () => void;
  active: boolean;
  index: number;
  move: (dragIndex: number, hoverIndex: number) => void;
};

function FunctionEditItem(props: FunctionEditItemProps) {
  const {fn, onClick, active, index, move} = props;

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: type,
    hover(item: DragItem) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      move(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{isDragging}, drag, dragPreview] = useDrag({
    item: {type, id: fn.id, index: index},
    collect: (monitor: any) => ({isDragging: monitor.isDragging()}),
  });

  dragPreview(drop(ref));

  return (
    <div>
      <Box ref={ref} isDragging={isDragging}>
        <ItemLeft onClick={onClick}>
          <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} />
        </ItemLeft>
        <ItemBody>
          <FunctionItem
            fn={fn}
            index={10} // XXX hide shortcut
            onClick={onClick}
            running={false}
          />
        </ItemBody>
        <ItemRight ref={drag}>
          <FontAwesomeIcon icon={faBars} />
        </ItemRight>
      </Box>
      {active && (
        <EditorBox>
          <Editor />
        </EditorBox>
      )}
    </div>
  );
}

export function Functions() {
  const [active, setActive] = useState<string | undefined>('builtin-markdown');
  const [functions, setFunctions] = useState<CopyFunctionWithTheme[]>([]);

  const toggleActive = useCallback(
    (id: string) => (active === id ? setActive(undefined) : setActive(id)),
    [active, functions]
  );

  useEffect(() => {
    getCopyFunctions().then(setFunctions);
  }, []); // TODO refresh

  const move = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const fs = [...functions];
      const [dragging] = fs.splice(dragIndex, 1);
      fs.splice(hoverIndex, 0, dragging);
      setFunctions(fs);
    },
    [functions]
  );

  return (
    <Section title="Functions">
      <DndProvider backend={HTML5Backend}>
        {functions.map((fn, idx) => (
          <FunctionEditItem
            key={fn.id}
            fn={fn}
            active={fn.id === active}
            onClick={() => toggleActive(fn.id)}
            index={idx}
            move={move}
          />
        ))}
      </DndProvider>
    </Section>
  );
}
