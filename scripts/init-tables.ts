import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Connection, createConnection } from 'mysql2/promise'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (Number(process.env.CAN_INIT_TABLES) !== 1) {
  throw new Error(
    "You can't initialize tables. Set `CAN_INIT_TABLES=1` environment variable to allow this operation."
  )
}

async function initTables() {
  const connection: Connection = await createConnection({
    uri: process.env.DATABASE_URL!
  })

  try {
    await executeSqlFile(connection, '000-init.sql')
    console.log('Tables have been initialized successfully.')
  } catch (error) {
    console.error('Error initializing tables:', error)
    throw error
  } finally {
    await connection.end()
  }
}

async function executeSqlFile(connection: Connection, filename: string) {
  const sqlPath = join(__dirname, '..', 'sql', filename)
  const sqlContent = await readFile(sqlPath, 'utf-8')

  // 分割 SQL 语句（如果文件中有多个语句）
  const statements = sqlContent
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

  for (const statement of statements) {
    await connection.query(statement)
    console.log(`Executed statement from ${filename}`)
  }

  console.log(`SQL file ${filename} has been executed successfully.`)
}

initTables()
