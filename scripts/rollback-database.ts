import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import BetterSqlite3 from 'better-sqlite3'
import { FileMigrationProvider, Kysely, Migrator, SqliteDialect } from 'kysely'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (Number(process.env.CAN_MIGRATE_DATABASE) !== 1) {
  throw new Error(
    "You can't run migrations. Set `CAN_MIGRATE_DATABASE=1` environment variable to allow this operation."
  )
}

async function rollback() {
  const sqlite = new BetterSqlite3(process.env.DATABASE_URL!)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  const db = new Kysely<unknown>({
    dialect: new SqliteDialect({ database: sqlite })
  })

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../migrations')
    })
  })

  const { error, results } = await migrator.migrateDown()

  if (!results || results.length === 0) {
    console.log('No migrations to roll back.')
  } else {
    for (const result of results) {
      if (result.status === 'Success') {
        console.log(`✓ Rolled back migration "${result.migrationName}" successfully`)
      } else if (result.status === 'Error') {
        console.error(`✗ Rollback of migration "${result.migrationName}" failed`)
      }
    }
  }

  await db.destroy()

  if (error) {
    console.error('Failed to roll back migration:', error)
    process.exit(1)
  }
}

rollback()
