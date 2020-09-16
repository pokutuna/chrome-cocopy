import {CopyFunctionWithTheme, isCopyFunctionWithTheme} from './function';
import {defaultFunctions} from './builtin';

export const getCopyFunctions = (): Promise<CopyFunctionWithTheme[]> => {
  return new Promise(resolve => {
    chrome.storage.sync.get({functions: defaultFunctions}, (value: any) => {
      Array.isArray(value.functions) ? resolve(value.functions) : resolve([]);
    });
  });
};

/**
 * Save functions to the straoge by chrome.storage.sync.
 *
 * TODO feedback errors to reach the limitation.
 * https://developer.chrome.com/extensions/storage
 *
 * @param functions
 */
export const setCopyFunctions = (
  functions: CopyFunctionWithTheme[]
): Promise<void> => {
  if (!functions.every(isCopyFunctionWithTheme)) {
    throw new Error('function validation failed when saving');
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({functions}, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
};
