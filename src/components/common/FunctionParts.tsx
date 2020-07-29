import {h} from 'preact';
import {useCallback, useMemo} from 'preact/hooks';
import styled from 'styled-components';

import {theme} from './Theme';
import {CopyFunctionTheme, CopyFunctionWithTheme} from '../../lib/function';
import {charLength} from '../../lib/util';

export const FunctionBox = styled.div<CopyFunctionTheme>`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: ${props => props.theme.constants.functionHeight};
  padding: ${props => props.theme.space[2]};
  color: ${props => props.textColor};
  background-color: ${props => props.backgroundColor};
  &:focus,
  &:hover {
    filter: brightness(110%);
  }
`;

function symbolSize(symbol: string): string {
  const len = charLength(symbol);
  let size: keyof typeof theme['size'];
  switch (len) {
    case 1:
      size = '3xl';
      break;
    case 2:
      size = 'xl';
      break;
    default:
      size = 'base';
      break;
  }
  return theme.size[size];
}

const FunctionSymbolBox = styled.div<{size: string}>`
  min-width: 30px;
  width: 30px;
  font-weight: ${props => props.theme.font['semibold']};
  font-family: monospace;
  font-size: ${props => props.size};
  overflow: hidden;
  margin-right: ${props => props.theme.space[2]};
  text-align: center;
`;

export function FunctionSymbol(props: {symbol: string}) {
  const size = useMemo(() => symbolSize(props.symbol), [props.symbol]);
  return <FunctionSymbolBox size={size}>{props.symbol}</FunctionSymbolBox>;
}

export const FunctionName = styled.div`
  font-size: ${props => props.theme.size.base};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

type FunctionItemProps = {
  fn: CopyFunctionWithTheme;
  onClick?: (fn: CopyFunctionWithTheme) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const onClick = useCallback(() => props.onClick?.(props.fn), [
    props.onClick,
    props.fn,
  ]);
  return (
    <FunctionBox {...props.fn.theme} onClick={onClick} tabIndex={-1}>
      <FunctionSymbol symbol={props.fn.theme.symbol} />
      <FunctionName>{props.fn.name}</FunctionName>
    </FunctionBox>
  );
}
