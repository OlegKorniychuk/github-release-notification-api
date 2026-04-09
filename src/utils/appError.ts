export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class GitHubApiError extends AppError {
  public readonly retryAfterMs?: number | undefined;

  constructor(statusCode: number, message: string, retryAfterMs?: number) {
    super(statusCode, message);
    this.name = 'GithubApiError';
    this.retryAfterMs = retryAfterMs;

    Error.captureStackTrace(this, this.constructor);
  }
}
