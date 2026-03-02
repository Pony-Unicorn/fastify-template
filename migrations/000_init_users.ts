import { type Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      inviter_code INTEGER DEFAULT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 0
    )
  `.execute(db)

  await sql`CREATE INDEX IF NOT EXISTS idx_inviter_code ON users (inviter_code)`.execute(db)
  await sql`CREATE INDEX IF NOT EXISTS idx_is_deleted ON users (is_deleted)`.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('users').execute()
}
