import BetterSqlite3 from 'better-sqlite3'
import { Kysely, SqliteDialect, sql } from 'kysely'

import { type DB } from 'kysely-codegen'
import { scryptHash } from '../src/plugins/app/password-manager.js'

async function seed() {
  const sqlite = new BetterSqlite3(process.env.DATABASE_URL!)
  sqlite.pragma('foreign_keys = ON')

  const db = new Kysely<DB>({
    dialect: new SqliteDialect({ database: sqlite })
  })

  try {
    await seedUsers(db)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await db.destroy()
  }
}

async function seedUsers(db: Kysely<DB>) {
  const users = [
    { username: 'basic', email: 'basic@example.com' },
    { username: 'moderator', email: 'moderator@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ]
  const hash = await scryptHash('Password123$')

  for (const user of users) {
    const result = await db
      .insertInto('users')
      .values({
        username: user.username,
        email: user.email,
        password: hash,
        created_at: sql<number>`unixepoch()`,
        updated_at: sql<number>`unixepoch()`
      })
      .executeTakeFirstOrThrow()

    console.log(`User ${Number(result.insertId)} has been seeded successfully.`)
  }

  console.log('Users have been seeded successfully.')
}

seed()
