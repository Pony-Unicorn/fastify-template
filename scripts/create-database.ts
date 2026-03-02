import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import BetterSqlite3 from 'better-sqlite3'

if (Number(process.env.CAN_CREATE_DATABASE) !== 1) {
  throw new Error(
    "You can't create the database. Set `CAN_CREATE_DATABASE=1` environment variable to allow this operation."
  )
}

function createDatabase() {
  const dbPath = process.env.DATABASE_URL!
  const dir = dirname(dbPath)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new BetterSqlite3(dbPath)
  db.close()

  console.log(`Database file created: ${dbPath}`)
}

createDatabase()
