import {PageTarget, TextTarget, ImageTarget, isTarget} from './target';
import {CopyFn} from './function';

export interface EvaluatePayload {
  code: string;
  target: PageTarget | TextTarget | ImageTarget;
}

export interface EvaluateResult {
  result: ReturnType<CopyFn>;
  error?: {
    type: 'ParseError' | 'ExecutionError';
    message: string;
  };
}

export function isEvaluatePayload(input: any): input is EvaluatePayload {
  return typeof input.code === 'string' && isTarget(input.target);
}

function isAcceptableResult(input: any): input is ReturnType<CopyFn> {
  return (
    typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'undefined' ||
    input === null
  );
}

export function evaluate(request: EvaluatePayload): EvaluateResult {
  let fn: Function;
  try {
    fn = eval.call(undefined, request.code);
    if (typeof fn !== 'function') {
      throw new Error('evaluating code is not a function');
    }
  } catch (e) {
    return {
      result: null,
      error: {
        type: 'ParseError',
        message: e.message,
      },
    };
  }

  let result: any;
  try {
    result = fn.call(undefined, request.target);
    if (!isAcceptableResult(result)) {
      throw new Error(
        'returning value is not a one of (string | number | null | undefined)'
      );
    }
  } catch (e) {
    return {
      result: null,
      error: {
        type: 'ExecutionError',
        message: e.message,
      },
    };
  }

  return {result};
}
