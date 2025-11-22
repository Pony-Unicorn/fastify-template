import { sql } from 'drizzle-orm'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql, { type Pool } from 'mysql2/promise'

import { usersTable } from '../src/models/schema.js'
import { scryptHash } from '../src/plugins/app/password-manager.js'

if (Number(process.env.CAN_SEED_DATABASE) !== 1) {
  throw new Error(
    "You can't seed the database. Set `CAN_SEED_DATABASE=1` environment variable to allow this operation."
  )
}

async function seed() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL!
  })

  const db = drizzle({
    client: pool
  })

  try {
    await seedUsers(db)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await pool.end()
  }
}

async function seedUsers(
  db: MySql2Database<Record<string, never>> & { $client: Pool }
) {
  const users = [
    { username: 'basic', email: 'basic@example.com' },
    { username: 'moderator', email: 'moderator@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ]
  const hash = await scryptHash('Password123$')

  for (const user of users) {
    const result = await db.insert(usersTable).values({
      username: user.username,
      email: user.email,
      password: hash,
      createdAt: sql`UNIX_TIMESTAMP()`,
      updatedAt: sql`UNIX_TIMESTAMP()`
    })

    // MySQL2 返回的 insertId 在 result 对象中
    const userId = (result as unknown as [{ insertId: number }])[0].insertId

    console.log(`User ${userId} has been seeded successfully.`)
  }

  console.log('Users have been seeded successfully.')
}

seed()
