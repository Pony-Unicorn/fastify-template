import { index, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { softDeletes, timestamps, versioning } from './columns.helpers.js'

export const usersTable = mysqlTable(
  'users',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    inviterCode: int('inviter_code', { unsigned: true }),
    ...timestamps,
    ...softDeletes,
    ...versioning
  },
  (table) => [index('idx_inviter_code').on(table.inviterCode)]
)
