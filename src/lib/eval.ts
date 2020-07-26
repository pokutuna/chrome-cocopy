import {PageTarget, TextTarget, ImageTarget, isTarget} from './target';
import {CopyResult} from './function';

export interface EvaluatePayload {
  code: string;
  target: PageTarget | TextTarget | ImageTarget;
}
export interface EvaluateResult {
  result: CopyResult;
  error?: {
    type: 'ParseError' | 'ExecutionError';
    message: string;
  };
}

export function isEvaluatePayload(input: any): input is EvaluatePayload {
  return typeof input.code === 'string' && isTarget(input.target);
}

function isAcceptableResult(input: any): input is CopyResult {
  return (
    typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'undefined' ||
    input === null
  );
}

export async function evaluate(
  request: EvaluatePayload
): Promise<EvaluateResult> {
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
    // currently type is not public
    delete request.target['type'];
    result = await Promise.resolve(fn.call(undefined, request.target));
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
