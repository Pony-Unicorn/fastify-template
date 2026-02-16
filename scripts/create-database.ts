import { Connection, createConnection } from 'mysql2/promise'

if (Number(process.env.CAN_CREATE_DATABASE) !== 1) {
  throw new Error(
    "You can't create the database. Set `CAN_CREATE_DATABASE=1` environment variable to allow this operation."
  )
}

async function createDatabase() {
  const connection: Connection = await createConnection({
    uri: process.env.DATABASE_URL!
  })

  try {
    await createDB(connection)
    console.log(
      `Database ${process.env.MYSQL_DATABASE} has been created successfully.`
    )
  } catch (error) {
    console.error('Error creating database:', error)
  } finally {
    await connection.end()
  }
}

async function createDB(connection: Connection) {
  const dbName = process.env.MYSQL_DATABASE
  if (!dbName || !/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(
      `Invalid MYSQL_DATABASE value: "${dbName}". Only alphanumeric characters and underscores are allowed.`
    )
  }

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
  )
  console.log(
    `Database ${process.env.MYSQL_DATABASE} created or already exists.`
  )
}

createDatabase()
