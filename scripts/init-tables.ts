import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import BetterSqlite3 from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (Number(process.env.CAN_INIT_TABLES) !== 1) {
  throw new Error(
    "You can't initialize tables. Set `CAN_INIT_TABLES=1` environment variable to allow this operation."
  )
}

function initTables() {
  const db = new BetterSqlite3(process.env.DATABASE_URL!)
  db.pragma('foreign_keys = ON')

  try {
    executeSqlFile(db, '000-init.sql')
    console.log('Tables have been initialized successfully.')
  } catch (error) {
    console.error('Error initializing tables:', error)
    throw error
  } finally {
    db.close()
  }
}

function executeSqlFile(db: BetterSqlite3.Database, filename: string) {
  const sqlPath = join(__dirname, '..', 'sql', filename)
  const sqlContent = readFileSync(sqlPath, 'utf-8')

  const statements = sqlContent
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

  for (const statement of statements) {
    db.prepare(statement).run()
    console.log(`Executed statement from ${filename}`)
  }

  console.log(`SQL file ${filename} has been executed successfully.`)
}

initTables()
