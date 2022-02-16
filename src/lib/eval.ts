import {Page, isPage} from './page';
import {CopyResult, RichContent} from './function';

export type EvalPayload =
  | {
      command: 'eval';
      code: string;
      page: Page;
    }
  | {command: 'parse'; code: string};

export type EvalError = {
  type: 'ParseError' | 'ExecutionError' | 'ReturnsEmpty';
  name: string;
  message: string;
};

export interface EvalResult {
  result: CopyResult;
  error?: EvalError;
}

export function isEvalPayload(input: any): input is EvalPayload {
  return (
    typeof input.code === 'string' &&
    (input.command === 'parse' ||
      (input.command === 'eval' && isPage(input.page)))
  );
}

function isAcceptableResult(input: any): input is CopyResult {
  return (
    typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'undefined' ||
    input === null ||
    isRichContent(input)
  );
}

export function isRichContent(input: any): input is RichContent {
  return typeof input === 'object' && 'html' in input && 'text' in input;
}

function isEmpty(input: any): boolean {
  return typeof input === 'undefined' || input === null;
}

function error(type: EvalError['type'], err: Error): EvalError {
  return {
    type,
    name: err.name,
    message: err.message,
  };
}

export async function evaluate(request: EvalPayload): Promise<EvalResult> {
  if (request.command !== 'parse' && request.command !== 'eval') {
    throw Error('unexpected command');
  }

  let fn: Function;
  try {
    fn = eval.call(undefined, request.code);
    if (typeof fn !== 'function') {
      throw new Error('code is not a function');
    }
  } catch (e) {
    return {
      result: null,
      error: error('ParseError', e),
    };
  }

  if (request.command === 'parse') {
    return {result: 'ok'};
  }

  let result: any;
  try {
    result = await Promise.resolve(fn.call(undefined, request.page));
    if (!isAcceptableResult(result)) {
      throw new Error(
        'returning value is not one of (string | number | { html: string, text: string } | null | undefined)'
      );
    }
  } catch (e) {
    return {
      result,
      error: error('ExecutionError', e),
    };
  }

  if (isEmpty(result)) {
    return {
      result,
      error: error(
        'ReturnsEmpty',
        new Error('returning value is empty (undefined or null)')
      ),
    };
  }

  return {result};
}
