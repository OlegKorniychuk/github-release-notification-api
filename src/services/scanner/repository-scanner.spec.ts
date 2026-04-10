import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { RepositoryScanner } from './repository-scanner.service.js';
import { GitHubApiError } from '../../utils/appError.js';
import type { GithubApi } from './github-api.interface.js';
import type {
  GithubApiResponse,
  GitHubRelease,
  GitHubRepository,
} from './github.types.js';

describe('RepositoryScanner', () => {
  let scanner: RepositoryScanner;
  let mockGithubApi: jest.Mocked<GithubApi>;

  const mockSuccess = <T>(data: T): GithubApiResponse<T> => ({
    error: null,
    data,
  });

  const mockError = (
    status: number,
    message: string,
    headers = new Map<string, string>(),
  ): GithubApiResponse<any> => ({
    error: {
      status,
      message,
      fullResponse: {
        headers: {
          get: (key: string) => headers.get(key) || null,
        },
      } as unknown as Response,
    },
    data: null,
  });

  beforeEach(() => {
    mockGithubApi = {
      getRepository: jest.fn(),
      getLatestRepositoryRelease: jest.fn(),
    } as unknown as jest.Mocked<GithubApi>;

    scanner = new RepositoryScanner(mockGithubApi);
  });

  describe('verifyRepository', () => {
    it('should return true when the repository exists', async () => {
      mockGithubApi.getRepository.mockResolvedValueOnce(
        mockSuccess({ id: 1, full_name: 'golang/go' } as GitHubRepository),
      );

      const result = await scanner.verifyRepository('golang', 'go');

      expect(mockGithubApi.getRepository).toHaveBeenCalledWith('golang', 'go');
      expect(result).toBe(true);
    });

    it('should return false when the repository is not found', async () => {
      mockGithubApi.getRepository.mockResolvedValueOnce(
        mockError(404, 'Not Found'),
      );

      const result = await scanner.verifyRepository('invalid', 'repo');

      expect(result).toBe(false);
    });

    it('should throw GitHubApiError and parse rate limit headers on 429', async () => {
      const resetTimeEpoch = Math.floor(Date.now() / 1000) + 3600;
      const headers = new Map([
        ['x-ratelimit-reset', resetTimeEpoch.toString()],
      ]);

      mockGithubApi.getRepository.mockResolvedValueOnce(
        mockError(429, 'Rate Limit Exceeded', headers),
      );

      try {
        await scanner.verifyRepository('golang', 'go');
      } catch (error: any) {
        expect(error).toBeInstanceOf(GitHubApiError);
        expect(error.statusCode || error.status).toBe(429);
        expect(error.retryAfterMs).toBe(resetTimeEpoch * 1000);
      }
    });

    it('should throw generic GitHubApiError for unhandled HTTP errors', async () => {
      mockGithubApi.getRepository.mockResolvedValueOnce(
        mockError(500, 'Internal Server Error'),
      );

      await expect(scanner.verifyRepository('golang', 'go')).rejects.toThrow(
        /GitHub API Error: Internal Server Error/,
      );
    });
  });

  describe('getLatestRelease', () => {
    it('should return release data when a release exists', async () => {
      const mockRelease = { tag_name: 'v1.0.0' } as GitHubRelease;
      mockGithubApi.getLatestRepositoryRelease.mockResolvedValueOnce(
        mockSuccess(mockRelease),
      );

      const result = await scanner.getLatestRelease('golang', 'go');

      expect(mockGithubApi.getLatestRepositoryRelease).toHaveBeenCalledWith(
        'golang',
        'go',
      );
      expect(result).toEqual(mockRelease);
    });

    it('should return null when the repository exists but has no releases', async () => {
      mockGithubApi.getLatestRepositoryRelease.mockResolvedValueOnce(
        mockError(404, 'Not Found'),
      );

      const result = await scanner.getLatestRelease('golang', 'go');

      expect(result).toBeNull();
    });

    it('should re-throw GitHubApiError for rate limit errors during release fetch', async () => {
      mockGithubApi.getLatestRepositoryRelease.mockResolvedValueOnce(
        mockError(403, 'Rate Limit'),
      );

      await expect(scanner.getLatestRelease('golang', 'go')).rejects.toThrow(
        GitHubApiError,
      );
    });
  });
});
