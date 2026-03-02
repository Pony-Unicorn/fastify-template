import { type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.createIndex('idx_user_id').on('posts').column('user_id').execute()
  await db.schema.createIndex('idx_status').on('posts').column('status').execute()
  await db.schema.createIndex('idx_published_at').on('posts').column('published_at').execute()
  await db.schema.createIndex('idx_is_deleted').on('posts').column('is_deleted').execute()
  await db.schema.createIndex('idx_user_status').on('posts').columns(['user_id', 'status']).execute()
  await db.schema.createIndex('idx_status_published').on('posts').columns(['status', 'published_at']).execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_status_published').on('posts').execute()
  await db.schema.dropIndex('idx_user_status').on('posts').execute()
  await db.schema.dropIndex('idx_is_deleted').on('posts').execute()
  await db.schema.dropIndex('idx_published_at').on('posts').execute()
  await db.schema.dropIndex('idx_status').on('posts').execute()
  await db.schema.dropIndex('idx_user_id').on('posts').execute()
}
