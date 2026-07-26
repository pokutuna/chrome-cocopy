import React, {useCallback} from 'react';

import {PatternIcon} from './Icon';

import styles from './FunctionParts.module.css';

export type FunctionBoxProps = {
  $textColor: string;
  $backgroundColor: string;
};

// CSS custom properties shared by FunctionBox and its descendants that need
// per-function dynamic colors (was styled-components props -> theme interpolation).
function functionBoxVars(props: FunctionBoxProps): React.CSSProperties {
  return {
    '--text-color': props.$textColor,
    '--background-color': props.$backgroundColor,
  } as React.CSSProperties;
}

export const FunctionBox = React.forwardRef<
  HTMLDivElement,
  FunctionBoxProps &
    Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'style'> & {
      className?: string;
    }
>(function FunctionBox(props, ref) {
  const {$textColor, $backgroundColor, className, ...rest} = props;
  return (
    <div
      ref={ref}
      className={[styles.functionBox, className].filter(Boolean).join(' ')}
      style={functionBoxVars({$textColor, $backgroundColor})}
      {...rest}
    />
  );
});

const ShortcutBox = (props: {children?: React.ReactNode}) => (
  <div className={styles.shortcutBox}>{props.children}</div>
);

type ShortcutProps = {
  textColor: string;
  shortcut?: number;
};

export function Shortcut(props: ShortcutProps) {
  return typeof props.shortcut !== 'undefined' ? (
    <ShortcutBox>
      <kbd
        className={styles.shortcutKey}
        style={{'--text-color': props.textColor} as React.CSSProperties}
      >
        {props.shortcut}
      </kbd>
    </ShortcutBox>
  ) : (
    <ShortcutBox />
  );
}

export const FunctionName = (props: {children?: React.ReactNode}) => (
  <div className={styles.functionName}>{props.children}</div>
);

export const RigthIconBox = (props: {
  $color: string;
  children?: React.ReactNode;
}) => (
  <div
    className={styles.rightIconBox}
    style={{'--icon-color': props.$color} as React.CSSProperties}
  >
    {props.children}
  </div>
);

/**
 * The subset a row needs to render. It accepts both a `CopyFunction` (an open
 * editor draft) and a `CopyFunctionRef` (a catalog entry, which carries no
 * code), so the list can be drawn without reading Function Documents.
 * `CopyFunction.pattern` is `string | undefined` and `CopyFunctionRef.pattern`
 * is `string | null`; only its truthiness matters here.
 */
export type FunctionDisplay = {
  id: string;
  name: string;
  pattern?: string | null;
  theme: {
    textColor: string;
    backgroundColor: string;
  };
};

type FunctionItemProps = {
  fn: FunctionDisplay;
  onClick?: (fn: FunctionDisplay) => void;
};

export function FunctionItem(props: FunctionItemProps) {
  const onClick = useCallback(
    () => props.onClick?.(props.fn),
    [props.onClick, props.fn],
  );
  return (
    <FunctionBox
      $textColor={props.fn.theme.textColor}
      $backgroundColor={props.fn.theme.backgroundColor}
      onClick={onClick}
      tabIndex={-1}
    >
      <ShortcutBox />
      <FunctionName>{props.fn.name}</FunctionName>
      {props.fn.pattern && (
        <RigthIconBox $color={props.fn.theme.textColor}>
          <PatternIcon />
        </RigthIconBox>
      )}
    </FunctionBox>
  );
}

export function AddFunctionItem(props: {onClick?: () => void}) {
  return (
    <FunctionBox
      className={styles.addNewFunctionBox}
      $textColor="#010203"
      $backgroundColor="#FFF"
      onClick={props.onClick}
    >
      <ShortcutBox />
      <FunctionName>Create New Function</FunctionName>
    </FunctionBox>
  );
}
