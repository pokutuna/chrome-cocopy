import {Page} from './page';
import {Library} from './library';
import {initialCode} from './builtin';
import {textColorFromBgColor} from './util';
import validate from './function.ajv';

export const currentVersion = 1;

export type CopyResult = string | null | undefined;
export type CopyFn = (
  this: Library,
  t: Page
) => CopyResult | Promise<CopyResult>;

export interface CopyFunction {
  id: string;
  name: string;
  code: string;
  pattern?: string;
  version: number;
  theme: {
    textColor: string;
    backgroundColor: string;
  };
}

export function generateId(): string {
  return `function-${new Date().getTime()}`;
}

export function newFunction(): CopyFunction {
  const id = generateId();
  const backgroundColor =
    colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const textColor = textColorFromBgColor(backgroundColor);

  return {
    id,
    name: 'function name',
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
  url: string,
  functions: T[]
): T[] {
  return functions.filter(f =>
    f.pattern ? new RegExp(f.pattern).test(url) : true
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

export function isCopyFunction(f: any): f is CopyFunction {
  return validate(f) as boolean;
}
