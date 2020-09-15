import {h} from 'preact';
import styled from 'styled-components';

import {EvalError} from '../../lib/eval';

const FunctionErrorBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const MessageBox = styled.div``;

export function FunctionError(props: {error: EvalError}) {
  return (
    <FunctionErrorBox>
      <MessageBox>
        {props.error.name}: {props.error.message}
      </MessageBox>
    </FunctionErrorBox>
  );
}
