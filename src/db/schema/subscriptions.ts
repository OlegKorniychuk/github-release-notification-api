import {
  boolean,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email').notNull(),
    repository: varchar('repository').notNull(),
    lastSeenTag: varchar('last_seen_tag'),
    confirmed: boolean('confirmed').default(false),
  },
  (table) => [uniqueIndex('repo_email_idx').on(table.email, table.repository)],
);
