interface EvaluateRequest {
  code: string;
}

interface EvaluateResponse {
  result?: string;
  error?: {
    type: string;
    message: string;
  };
}
