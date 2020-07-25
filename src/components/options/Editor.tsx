import {h, Fragment} from 'preact';
import {useState, useCallback} from 'preact/hooks';

import {SectionTitle} from '../options/Parts';
import {CopyFunctionWithTheme} from '../../lib/function';
import {FunctionItem} from '../Function';

export function PreviewFuncitonItem(props: {function: CopyFunctionWithTheme}) {
  const [running, setRunning] = useState(false);
  const onClick = useCallback(() => {
    setRunning(true);
    setTimeout(() => setRunning(false), 300);
  }, []);

  return (
    <FunctionItem
      fn={props.function}
      index={1}
      running={running}
      onClick={onClick}
    />
  );
}

export function Editor() {
  return (
    <Fragment>
      <SectionTitle title="Function" />
      <form>
        <input type="string" name="name" />
      </form>
    </Fragment>
  );
}
