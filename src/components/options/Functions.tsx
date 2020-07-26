import {h} from 'preact';
import {useState, useEffect, useCallback, useRef} from 'preact/hooks';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {FunctionItem} from '../Function';
import {DnDWrapper, useDnDItem} from '../options/DnD';
import {Section} from '../options/Parts';
import {Editor} from '../options/Editor';
import {
  FunctionBox,
  ItemLeft,
  ItemBody,
  ItemRight,
  EditorBox,
} from './FunctionsLayout';

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
  const {isDragging, drag} = useDnDItem({
    id: fn.id,
    index,
    ref,
    move,
  });

  return (
    <div ref={ref}>
      <FunctionBox isDragging={isDragging}>
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
      </FunctionBox>
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
      <DnDWrapper>
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
      </DnDWrapper>
    </Section>
  );
}
