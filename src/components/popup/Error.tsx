import styled from 'styled-components';

import {EvalError} from '../../lib/eval';

const FunctionErrorBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export function FunctionError(props: {error: EvalError}) {
  return (
    <FunctionErrorBox>
      {props.error.name}: {props.error.message}
    </FunctionErrorBox>
  );
}
