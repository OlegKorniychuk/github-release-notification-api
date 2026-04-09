import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { RepositoryScanner } from './repository-scanner.service.js';
import { GitHubApiError } from '../../utils/appError.js';

const mockFetchResponse = (
  status: number,
  ok: boolean,
  body: any,
  headers = new Map<string, string>(),
) => {
  return Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
    headers: {
      get: (key: string) => headers.get(key) || null,
    },
  } as unknown as Response);
};

describe('RepositoryScanner', () => {
  let scanner: RepositoryScanner;
  const originalFetch = global.fetch;
  const mockToken = 'test_token';
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch as unknown as typeof fetch;
    scanner = new RepositoryScanner(mockToken);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('verifyRepository', () => {
    it('should return repository data when the repository exists', async () => {
      const mockRepoData = { id: 1, full_name: 'golang/go' };
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(200, true, mockRepoData),
      );

      const result = await scanner.verifyRepository('golang', 'go');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/golang/go',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockRepoData);
    });

    it('should throw GitHubApiError with status 404 when repository is not found', async () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(404, false, { message: 'Not Found' }),
      );

      try {
        await scanner.verifyRepository('invalid', 'repo');
      } catch (error: any) {
        expect(error).toBeInstanceOf(GitHubApiError);
        expect(error.statusCode).toBe(404);
      }
    });

    it('should throw GitHubApiError and parse rate limit headers on 403/429', async () => {
      const resetTimeEpoch = Math.floor(Date.now() / 1000) + 3600;
      const headers = new Map([
        ['x-ratelimit-reset', resetTimeEpoch.toString()],
      ]);

      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(
          403,
          false,
          { message: 'API rate limit exceeded' },
          headers,
        ),
      );

      try {
        await scanner.verifyRepository('golang', 'go');
      } catch (error: any) {
        expect(error).toBeInstanceOf(GitHubApiError);
        expect(error.statusCode).toBe(429);
        expect(error.retryAfterMs).toBe(resetTimeEpoch * 1000);
      }
    });

    it('should throw generic GitHubApiError for unhandled HTTP errors', async () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(500, false, { message: 'Internal Server Error' }),
      );

      await expect(scanner.verifyRepository('golang', 'go')).rejects.toThrow(
        /GitHub API Error/,
      );
    });
  });

  describe('getLatestRelease', () => {
    it('should return release data when a release exists', async () => {
      const mockReleaseData = { tag_name: 'v1.0.0', name: 'Initial Release' };
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(200, true, mockReleaseData),
      );

      const result = await scanner.getLatestRelease('golang', 'go');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/golang/go/releases/latest',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockReleaseData);
    });

    it('should return null when the repository exists but has no releases (404 Not Found)', async () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(404, false, { message: 'Not Found' }),
      );

      const result = await scanner.getLatestRelease(
        'owner',
        'no-releases-repo',
      );

      expect(result).toBeNull();
    });

    it('should re-throw GitHubApiError for rate limit errors during release fetch', async () => {
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(429, false, { message: 'Rate Limit' }),
      );

      await expect(scanner.getLatestRelease('golang', 'go')).rejects.toThrow(
        GitHubApiError,
      );
    });
  });
});
