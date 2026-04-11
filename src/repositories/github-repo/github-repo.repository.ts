import type { DrizzleClient } from '../../db/client.js';
import { githubRepositories } from '../../db/schema/repositories.js';
import type { CreateGithubRepo, GithubRepo } from './github-repo.types.js';

export class GithubRepoRepository {
  constructor(private readonly db: DrizzleClient) {}

  public async findByName(name: string): Promise<GithubRepo | null> {
    const result = await this.db.query.githubRepositories.findFirst({
      where: { name },
    });

    return result || null;
  }

  public async findById(id: string): Promise<GithubRepo | null> {
    const result = await this.db.query.githubRepositories.findFirst({
      where: { id },
    });

    return result || null;
  }

  public async createOne(data: CreateGithubRepo): Promise<GithubRepo> {
    const [result] = await this.db
      .insert(githubRepositories)
      .values(data)
      .returning();

    return result!;
  }
}
