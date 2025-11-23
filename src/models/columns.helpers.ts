import { bigint, int, tinyint } from 'drizzle-orm/mysql-core'

export const timestamps = {
  updatedAt: bigint('updated_at', { mode: 'number', unsigned: true }).notNull(),
  createdAt: bigint('created_at', { mode: 'number', unsigned: true }).notNull()
}

export const softDeletes = {
  deletedAt: bigint('deleted_at', {
    mode: 'number',
    unsigned: true
  }).default(0),
  isDeleted: tinyint('is_deleted', { unsigned: true }).notNull().default(0)
}

export const versioning = {
  version: int({ unsigned: true }).notNull().default(0)
}
