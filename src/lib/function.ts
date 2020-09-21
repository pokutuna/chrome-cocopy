import {TargetType, PageTarget, TextTarget, ImageTarget} from './target';
import {Library} from './library';
import {initialCode} from './builtin';
import {textColorFromBgColor} from './util';
import validate from './function.ajv';

export const currentVersion = 1;

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
  textColor: string;
  backgroundColor: string;
}

export interface CopyFunctionWithTheme extends CopyFunction {
  theme: CopyFunctionTheme;
}

export function generateId(): string {
  return `function-${new Date().getTime()}`;
}

export function newFunction(): CopyFunctionWithTheme {
  const id = generateId();
  const backgroundColor =
    colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const textColor = textColorFromBgColor(backgroundColor);

  return {
    id,
    name: 'function name',
    types: ['page'],
    code: initialCode,
    pattern: '',
    theme: {
      textColor,
      backgroundColor,
    },
    version: currentVersion,
  };
}

export function filterFunctions<T extends CopyFunction>(
  targetType: TargetType,
  pageURL: string,
  functions: T[]
): T[] {
  return functions.filter(
    f =>
      f.types.includes(targetType) &&
      (f.pattern ? new RegExp(f.pattern).test(pageURL) : true)
  );
}

export const colorPalette = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FFC107',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
];

export function isCopyFunctionWithTheme(f: any): f is CopyFunctionWithTheme {
  return validate(f) as boolean;
}
