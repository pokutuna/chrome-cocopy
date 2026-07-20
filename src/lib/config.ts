import {defaultFunctions} from './builtin';
import {CopyFunction, isCopyFunction} from './function';

const storage: chrome.storage.StorageArea = chrome.storage.sync;

// User-defined functions are not needed by content scripts. Restrict sync
// storage to extension-owned contexts when the API is available (Chrome 102+)
// while keeping the extension usable on older MV3 Chrome versions.
const storageAccessReady =
  typeof storage.setAccessLevel === 'function'
    ? Promise.resolve(storage.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'}))
    : Promise.resolve();

export async function getCopyFunctions(): Promise<CopyFunction[]> {
  await storageAccessReady;
  const value = await storage.get<{functions?: CopyFunction[]}>({
    functions: defaultFunctions,
  });
  return Array.isArray(value.functions) ? value.functions : [];
}

/**
 * Save functions to chrome.storage.sync.
 *
 * TODO feedback errors to reach the limitation.
 * https://developer.chrome.com/docs/extensions/reference/api/storage
 *
 * @param functions
 */
export async function saveCopyFunctions(
  functions: CopyFunction[],
): Promise<void> {
  if (!functions.every(isCopyFunction)) {
    throw new Error('function validation failed when saving');
  }

  await storageAccessReady;
  await storage.set({functions});
}

export async function addCopyFunctions(fn: CopyFunction): Promise<void> {
  const functions = await getCopyFunctions();
  functions.push(fn);
  return saveCopyFunctions(functions);
}
