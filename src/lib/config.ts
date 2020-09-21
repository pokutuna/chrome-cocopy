import {CopyFunction, isCopyFunction} from './function';
import {defaultFunctions} from './builtin';

const storage: chrome.storage.StorageArea = chrome.storage.sync;

export async function getCopyFunctions(): Promise<CopyFunction[]> {
  return new Promise(resolve => {
    storage.get({functions: defaultFunctions}, (value: any) => {
      Array.isArray(value.functions) ? resolve(value.functions) : resolve([]);
    });
  });
}

/**
 * Save functions to the straoge by chrome.storage.sync.
 *
 * TODO feedback errors to reach the limitation.
 * https://developer.chrome.com/extensions/storage
 *
 * @param functions
 */
export async function setCopyFunctions(
  functions: CopyFunction[]
): Promise<void> {
  if (!functions.every(isCopyFunction)) {
    throw new Error('function validation failed when saving');
  }

  return new Promise((resolve, reject) => {
    storage.set({functions}, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

export async function addCopyFunctions(fn: CopyFunction): Promise<void> {
  const functions = await getCopyFunctions();
  functions.push(fn);
  return setCopyFunctions(functions);
}
