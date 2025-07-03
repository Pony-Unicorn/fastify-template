import { Connection, createConnection } from 'mysql2/promise'

import { scryptHash } from '../src/plugins/app/password-manager.js'

if (Number(process.env.CAN_SEED_DATABASE) !== 1) {
  throw new Error(
    "You can't seed the database. Set `CAN_SEED_DATABASE=1` environment variable to allow this operation."
  )
}

async function seed() {
  const connection: Connection = await createConnection({
    uri: process.env.DATABASE_URL!
  })

  try {
    await seedUsers(connection)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await connection.end()
  }
}

async function seedUsers(connection: Connection) {
  const users = [
    { username: 'basic', email: 'basic@example.com' },
    { username: 'moderator', email: 'moderator@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ]
  const hash = await scryptHash('Password123$')

  for (const user of users) {
    const [userResult] = await connection.execute(
      `
      INSERT INTO users (username, email, password, created_at, updated_at)
      VALUES (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
    `,
      [user.username, user.email, hash]
    )

    const userId = (userResult as { insertId: number }).insertId

    console.log(`User ${userId} has been seeded successfully.`)
  }

  console.log('Users have been seeded successfully.')
}

seed()
