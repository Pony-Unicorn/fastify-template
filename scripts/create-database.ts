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
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
  )
  console.log(
    `Database ${process.env.MYSQL_DATABASE} created or already exists.`
  )
}

createDatabase()
