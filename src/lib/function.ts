import globToRegExp from 'glob-to-regexp';

import {TargetType} from './target';

export interface CopyFunction {
  id: string;
  name: string;
  types: TargetType[];
  code: string;
  glob?: string;
  enabled: boolean;
  isBuiltIn: boolean;
  version: number;
}

export interface CopyFunctionTheme {
  icon: {
    char: string;
  };
  textColor: string;
  backgroundColor: string;
}

export interface CopyFunctionWithTheme extends CopyFunction {
  theme: CopyFunctionTheme;
}

export function filterFunctions(
  targetType: TargetType,
  pageURL: string,
  functions: CopyFunction[]
): CopyFunction[] {
  return functions.filter(
    f =>
      f.enabled &&
      f.types.includes(targetType) &&
      (f.glob ? globToRegExp(f.glob).test(pageURL) : true)
  );
}
