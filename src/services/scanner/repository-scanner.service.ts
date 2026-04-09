import { GitHubApiError } from '../../utils/appError.js';
import type { GitHubRelease, GitHubRepository } from './github.types.js';

export class RepositoryScanner {
  private readonly baseUrl = 'https://api.github.com';
  private readonly headers: Record<string, string>;

  constructor(token: string) {
    this.headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Releases-API-Scanner',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  public async verifyRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubRepository> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: this.headers,
    });

    return this.handleResponse<GitHubRepository>(response);
  }

  public async getLatestRelease(
    owner: string,
    repo: string,
  ): Promise<GitHubRelease | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/releases/latest`,
        {
          method: 'GET',
          headers: this.headers,
        },
      );

      return await this.handleResponse<GitHubRelease>(response);
    } catch (error) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return (await response.json()) as T;
    }

    if (response.status === 403 || response.status === 429) {
      const resetHeader = response.headers.get('x-ratelimit-reset');
      const resetTimeMs = resetHeader
        ? parseInt(resetHeader, 10) * 1000
        : undefined;

      throw new GitHubApiError(
        429,
        'GitHub API Rate Limit Exceeded',
        resetTimeMs,
      );
    }

    if (response.status === 404) {
      throw new GitHubApiError(404, 'Repository or Release not found');
    }

    throw new GitHubApiError(
      response.status,
      `GitHub API Error: ${response.statusText}`,
    );
  }
}
