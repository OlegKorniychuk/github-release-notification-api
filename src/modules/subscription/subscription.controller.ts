import type { Request, Response, NextFunction } from 'express';

function subscribe(req: Request, res: Response, next: NextFunction) {
  res.status(200).json({ message: 'Not Implemented' });
}

export const subscriptionController = { subscribe };
