import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {faCaretRight} from '@fortawesome/free-solid-svg-icons/faCaretRight';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import {AddFunctionItem} from '../common/FunctionParts';

import styles from './FunctionList.module.css';

export const Caret = (props: {active: boolean; onClick: () => void}) => {
  const {active, onClick} = props;
  return (
    <button
      type="button"
      className={styles.itemButton}
      onClick={onClick}
      aria-label={active ? 'Collapse function' : 'Expand function'}
      aria-expanded={active}
    >
      <FontAwesomeIcon icon={active ? faCaretDown : faCaretRight} size="lg" />
    </button>
  );
};

export const DragKnob = (props: {draggable: boolean}) => {
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

export function AddFunction(props: {onClick: () => void}) {
  return (
    <div className={styles.functionItemBox}>
      <button
        type="button"
        className={styles.itemButton}
        onClick={props.onClick}
        aria-label="Create new function"
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <AddFunctionItem onClick={props.onClick} />
    </div>
  );
}
