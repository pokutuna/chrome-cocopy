import {PageTarget, TextTarget, ImageTarget, isTarget} from './target';

export interface EvaluateRequest {
  code: string;
  target: PageTarget | TextTarget | ImageTarget;
}

export interface EvaluateResponse {
  result: string | null;
  error?: {
    type: 'ParseError' | 'ExecutionError';
    message: string;
  };
}

export function isCopyRequest(input: any): input is EvaluateRequest {
  return typeof input.code === 'string' && isTarget(input.target);
}
