import globToRegExp from 'glob-to-regexp';

import {TargetType, PageTarget, TextTarget, ImageTarget} from './target';

type CopyResult = string | number | null | undefined;
export type CopyFn =
  | (() => CopyResult | Promise<CopyResult>)
  | ((t: PageTarget) => CopyResult | Promise<CopyResult>)
  | ((t: TextTarget) => CopyResult | Promise<CopyResult>)
  | ((t: ImageTarget) => CopyResult | Promise<CopyResult>);

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
