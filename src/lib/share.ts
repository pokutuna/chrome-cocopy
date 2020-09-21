import {
  CopyFunctionWithTheme,
  generateId,
  isCopyFunctionWithTheme,
} from './function';

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

export function encodeSharable(fn: CopyFunctionWithTheme): string {
  // TODO remove extra properties
  const data = {...fn};
  delete data.id;
  delete data.types;
  return toBase64(JSON.stringify(data));
}

export function decodeSharable(
  encoded: string
): CopyFunctionWithTheme | undefined {
  try {
    const data = JSON.parse(fromBase64(encoded));
    data.id = generateId();
    data.types = ['page'];
    return isCopyFunctionWithTheme(data) ? data : undefined;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
