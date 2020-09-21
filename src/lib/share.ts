import {CopyFunction, generateId, isCopyFunction} from './function';

function toBase64(data: string): string {
  return window.btoa
    ? window.btoa(data)
    : Buffer.from(data, 'binary').toString('base64');
}

function fromBase64(data: string): string {
  return window.atob
    ? window.atob(data)
    : Buffer.from(data, 'base64').toString();
}

export function encodeSharable(fn: CopyFunction): string {
  if (!isCopyFunction(fn)) {
    throw new Error('fn is not a CopyFunction');
  }

  const data = {...fn};
  delete data.id;
  return toBase64(JSON.stringify(data));
}

export function decodeSharable(encoded: string): CopyFunction | undefined {
  try {
    const data = JSON.parse(fromBase64(encoded));
    data.id = generateId();
    return isCopyFunction(data) ? data : undefined;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
