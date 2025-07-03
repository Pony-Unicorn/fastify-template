import { int, tinyint } from 'drizzle-orm/mysql-core'

export const timestamps = {
  updatedAt: int('updated_at', { unsigned: true }).notNull(),
  createdAt: int('created_at', { unsigned: true }).notNull()
}

export const softDeletes = {
  deletedAt: int('deleted_at', { unsigned: true }).default(0),
  isDeleted: tinyint('is_deleted', { unsigned: true }).notNull().default(0)
}

export const versioning = {
  version: int({ unsigned: true }).notNull().default(0)
}
