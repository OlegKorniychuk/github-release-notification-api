import type { Request, Response, NextFunction } from 'express';
import type { SubscriptionService } from './subscription.service.js';

export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  public async subscribe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const [owner, repoName] = req.body.repo.split('/');
    await this.service.subscribe(req.body.email, owner, repoName);

    res
      .status(200)
      .json({ message: 'Subscription successful. Confirmation email sent.' });
  }

  public async confirmSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = req.params['token'];

    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Token missing' });
      return;
    }

    await this.service.confirmSubscription(token);

    res.status(200).json({ message: 'Subscription confirmed successfully.' });
  }
}
