/**
 * Backend error shape — matches /api/* error responses.
 * See docs/backend/api-contract.md § Error format.
 */
export interface ApiErrorPayload {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorTitle: string;
  readonly path: string;
  readonly fields: Record<string, string>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = payload.status;
    this.errorTitle = payload.error;
    this.path = payload.path;
    this.fields = payload.fields ?? {};
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isNotFound()     { return this.status === 404; }
  get isValidation()   { return this.status === 400; }
  get isConflict()     { return this.status === 409; }
}

export async function parseApiError(res: Response): Promise<ApiError> {
  try {
    const payload: ApiErrorPayload = await res.json();
    return new ApiError(payload);
  } catch {
    return new ApiError({
      timestamp: new Date().toISOString(),
      status: res.status,
      error: res.statusText,
      message: `HTTP ${res.status}`,
      path: '',
    });
  }
}
