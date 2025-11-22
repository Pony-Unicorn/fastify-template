import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Connection, createConnection } from 'mysql2/promise'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (Number(process.env.CAN_MIGRATE_DATABASE) !== 1) {
  throw new Error(
    "You can't run migrations. Set `CAN_MIGRATE_DATABASE=1` environment variable to allow this operation."
  )
}

interface Migration {
  filename: string
  executedAt: Date
}

async function migrate() {
  const connection: Connection = await createConnection({
    uri: process.env.DATABASE_URL!
  })

  try {
    // 确保迁移表存在
    await createMigrationsTable(connection)

    // 获取所有 SQL 文件
    const sqlFiles = await getSqlFiles()
    console.log(`Found ${sqlFiles.length} migration files`)

    // 获取已执行的迁移
    const executedMigrations = await getExecutedMigrations(connection)
    const executedFilenames = new Set(executedMigrations.map((m) => m.filename))

    // 过滤出未执行的迁移
    const pendingMigrations = sqlFiles.filter(
      (file) => !executedFilenames.has(file)
    )

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations to run.')
      return
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`)

    // 执行每个未执行的迁移
    for (const filename of pendingMigrations) {
      await executeMigration(connection, filename)
    }

    console.log('All migrations completed successfully.')
  } catch (error) {
    console.error('Error running migrations:', error)
    throw error
  } finally {
    await connection.end()
  }
}

async function createMigrationsTable(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_filename (filename)
    ) ENGINE = InnoDB
  `)
  console.log('Migrations table is ready.')
}

async function getSqlFiles(): Promise<string[]> {
  const sqlDir = join(__dirname, '..', 'sql')
  const files = await readdir(sqlDir)

  // 过滤并排序 SQL 文件
  return files
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
}

async function getExecutedMigrations(
  connection: Connection
): Promise<Migration[]> {
  const [rows] = await connection.query(
    'SELECT filename, executed_at FROM migrations ORDER BY executed_at'
  )
  return rows as Migration[]
}

async function executeMigration(connection: Connection, filename: string) {
  console.log(`\nExecuting migration: ${filename}`)

  const sqlPath = join(__dirname, '..', 'sql', filename)
  const sqlContent = await readFile(sqlPath, 'utf-8')

  // 分割 SQL 语句（处理多个语句的情况）
  const statements = sqlContent
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

  // 使用事务执行迁移
  await connection.beginTransaction()

  try {
    // 执行所有 SQL 语句
    for (const statement of statements) {
      await connection.query(statement)
    }

    // 记录迁移
    await connection.execute('INSERT INTO migrations (filename) VALUES (?)', [
      filename
    ])

    await connection.commit()
    console.log(`✓ Migration ${filename} completed successfully`)
  } catch (error) {
    await connection.rollback()
    console.error(`✗ Migration ${filename} failed:`, error)
    throw error
  }
}

migrate()
