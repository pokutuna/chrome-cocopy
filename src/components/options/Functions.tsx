import {h} from 'preact';
import {useState, useEffect, useCallback} from 'preact/hooks';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunctionWithTheme} from '../../lib/function';

import {Section} from '../options/Parts';
import {FunctionItem} from '../Function';

type FunctionEditItemProps = {
  fn: CopyFunctionWithTheme;
  onClick: () => void;
  active: boolean;
};

function FunctionEditItem(props: FunctionEditItemProps) {
  return (
    <div>
      <FunctionItem
        fn={props.fn}
        index={10} // XXX hide shortcut
        onClick={props.onClick}
        running={false}
      />
    </div>
  );
}

export function Functions() {
  const [active, setActive] = useState<number | undefined>(0);
  const [functions, setFunctions] = useState<CopyFunctionWithTheme[]>([]);

  useEffect(() => {
    getCopyFunctions().then(setFunctions);
  }, []); // TODO refresh

  return (
    <Section title="Function">
      {functions.map((fn, idx) => (
        <FunctionEditItem
          key={fn.id}
          fn={fn}
          active={idx === active}
          onClick={() => setActive(idx)}
        />
      ))}
    </Section>
  );
}
