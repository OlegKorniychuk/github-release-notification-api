import { GitHubApiError } from '../../utils/appError.js';
import type { GithubApi } from './github-api.interface.js';
import type { GithubApiErrorResponse, GitHubRelease } from './github.types.js';

export class RepositoryScanner {
  constructor(private readonly githubApi: GithubApi) {}

  public async verifyRepository(owner: string, repo: string): Promise<boolean> {
    const response = await this.githubApi.getRepository(owner, repo);

    if (!response.error) return true;
    if (response.error.status === 404) return false;

    this.handleErrorResponse(response);
  }

  public async getLatestRelease(
    owner: string,
    repo: string,
  ): Promise<GitHubRelease | null> {
    const response = await this.githubApi.getLatestRepositoryRelease(
      owner,
      repo,
    );

    if (!response.error) return response.data;
    if (response.error.status === 404) return null;

    this.handleErrorResponse(response);
  }

  private handleErrorResponse(errorResponse: GithubApiErrorResponse): never {
    if (
      errorResponse.error.status === 403 ||
      errorResponse.error.status === 429
    ) {
      const resetHeader =
        errorResponse.error.fullResponse.headers.get('x-ratelimit-reset');
      const resetTimeMs = resetHeader
        ? parseInt(resetHeader, 10) * 1000
        : undefined;

      throw new GitHubApiError(
        429,
        'GitHub API Rate Limit Exceeded',
        resetTimeMs,
      );
    }

    if (errorResponse.error.status === 404) {
      throw new GitHubApiError(404, 'Repository or Release not found');
    }

    throw new GitHubApiError(
      errorResponse.error.status,
      `GitHub API Error: ${errorResponse.error.message}`,
    );
  }
}
