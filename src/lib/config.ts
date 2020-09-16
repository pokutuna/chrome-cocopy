import {CopyFunctionWithTheme} from './function';
import {defaultFunctions} from './builtin';

export const getCopyFunctions = (): Promise<CopyFunctionWithTheme[]> => {
  return new Promise(resolve => {
    chrome.storage.sync.get({functions: defaultFunctions}, (value: any) => {
      Array.isArray(value.functions) ? resolve(value.functions) : resolve([]);
    });
  });
};

export const setCopyFunctions = (
  functions: CopyFunctionWithTheme[]
): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.sync.set({functions}, resolve);
  });
};
