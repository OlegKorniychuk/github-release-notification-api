import { AppErrorTypesEnum, type AppError } from '../errors/app.error.js';
import type { Response } from 'express';

export function handleAppError(err: AppError, res: Response): void {
  const handlersMap: Record<
    AppErrorTypesEnum,
    (err: AppError, res: Response) => void
  > = {
    [AppErrorTypesEnum.invalidNotificationToken]: (err, res) =>
      res.status(400).json({ message: 'Invalid notification token' }),
    [AppErrorTypesEnum.other]: (err, res) => {
      console.error(err);
      res.status(500).json({ message: 'Unexpected server error' });
    },
  };

  return handlersMap[err.type](err, res);
}
