import type { Request, Response, NextFunction } from 'express';
import type { SubscriptionService } from './subscription.service.js';
import type { ConfirmInput, SubscribeInput } from './subscription.schema.js';

export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  public async subscribe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const body = req.body as SubscribeInput;

    const [owner, repoName] = body.repo.split('/');
    await this.service.subscribe(body.email, owner!, repoName!);

    res
      .status(200)
      .json({ message: 'Subscription successful. Confirmation email sent.' });
  }

  public async confirmSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const params = req.params as ConfirmInput;

    await this.service.confirmSubscription(params.token);

    res.status(200).json({ message: 'Subscription confirmed successfully.' });
  }
}
