import type { EnumFromRecord } from '../../enum-from-record.js';

export const AppErrorTypesEnum = {
  other: 'other',
  invalidNotificationToken: 'invalidNotificationToken',
} as const;

export type AppErrorTypesEnum = EnumFromRecord<typeof AppErrorTypesEnum>;

export class AppError extends Error {
  public readonly type: AppErrorTypesEnum;

  constructor(type: AppErrorTypesEnum, message: string) {
    super(message);
    this.type = type;
  }
}
