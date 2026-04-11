import { and, eq } from 'drizzle-orm';
import type { DrizzleClient } from '../../db/client.js';
import { subscriptions } from '../../db/schema/subscriptions.js';
import type { CreateSubscription, Subscription } from './subscription.types.js';

export class SubscriptionRepository {
  constructor(private readonly db: DrizzleClient) {}

  public async createOne(data: CreateSubscription): Promise<Subscription> {
    const [result] = await this.db
      .insert(subscriptions)
      .values(data)
      .returning();

    return result!;
  }

  public async confirm(id: string): Promise<Subscription | null> {
    const [result] = await this.db
      .update(subscriptions)
      .set({ confirmed: true })
      .where(and(eq(subscriptions.id, id), eq(subscriptions.confirmed, false)))
      .returning();

    return result || null;
  }

  public async findOneWithRepo(id: string) {
    const result = await this.db.query.subscriptions.findFirst({
      where: { id },
      with: { githubRepository: true },
    });

    return result || null;
  }

  public async findOneByRepoAndEmail(
    email: string,
    githubRepositoryId: string,
  ): Promise<Subscription | null> {
    const result = await this.db.query.subscriptions.findFirst({
      where: {
        email,
        githubRepositoryId,
      },
    });

    return result || null;
  }
}
