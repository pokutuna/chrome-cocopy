import {TargetType, PageTarget, TextTarget, ImageTarget} from './target';
import {Library} from './library';

export type CopyResult = string | null | undefined;
export type CopyFn =
  | ((this: Library) => CopyResult | Promise<CopyResult>)
  | ((this: Library, t: PageTarget) => CopyResult | Promise<CopyResult>)
  | ((this: Library, t: TextTarget) => CopyResult | Promise<CopyResult>)
  | ((this: Library, t: ImageTarget) => CopyResult | Promise<CopyResult>);

export interface CopyFunction {
  id: string;
  name: string;
  types: TargetType[];
  code: string;
  pattern?: string;
  version: number;
}

export interface CopyFunctionTheme {
  symbol: string;
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
      f.types.includes(targetType) &&
      (f.pattern ? new RegExp(f.pattern).test(pageURL) : true)
  );
}
