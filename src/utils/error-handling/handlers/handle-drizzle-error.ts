import type { Response } from 'express';
import type { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

export function handleDatabaseError(
  err: DrizzleQueryError,
  res: Response,
): void {
  const codesMap: Record<string, (error: DatabaseError) => void> = {
    '2305': (error: DatabaseError): void => {
      const tableName = error.table;
      const entity = tableName
        ? tableName.substring(0, tableName.length - 1)
        : 'entity';
      res.status(409).json({ message: `This ${entity} does not exist` });
      return;
    },
  };

  if (err.cause instanceof DatabaseError && err.cause.code) {
    const handler = codesMap[err.cause.code];

    if (handler) {
      return handler(err.cause);
    }
  }

  res.status(500).json({ message: 'Unexpected server error' });
}
