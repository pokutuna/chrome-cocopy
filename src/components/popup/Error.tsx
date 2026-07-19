import {EvalError} from '../../lib/eval';

import styles from './Error.module.css';

export function FunctionError(props: {error: EvalError}) {
  return (
    <div className={styles.functionErrorBox}>
      {props.error.name}: {props.error.message}
    </div>
  );
}
