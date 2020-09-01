import {h} from 'preact';
import styled from 'styled-components';

import {EvalError} from '../../lib/eval';

const FunctionErrorBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const MessageBox = styled.div`
  flex-grow: 1;
  overflow: hidden;
`;
const DetailBox = styled.div`
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  align-items: center;
  margin-left: auto;
  padding: ${props => props.theme.space[2]};
`;

export function FunctionError(props: {error: EvalError}) {
  return (
    <FunctionErrorBox>
      <MessageBox>
        {props.error.name}: {props.error.message}
      </MessageBox>
      <DetailBox>
        <a href="/options.html#errors" target="_blank" tabIndex={1}>
          detail
        </a>
      </DetailBox>
    </FunctionErrorBox>
  );
}
