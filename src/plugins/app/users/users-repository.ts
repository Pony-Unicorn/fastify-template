import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { and, eq, sql } from 'drizzle-orm'

import { usersTable } from '../../../models/schema.js'
import { type MySqlDBTransaction } from '../../../models/types.js'
import { toResult } from '../../../utils/result.js'
import { ok } from 'neverthrow'

declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>
  }
}

export function createUsersRepository(fastify: FastifyInstance) {
  const db = fastify.db

  return {
    async findByEmail(email: string, trx?: MySqlDBTransaction) {
      return toResult(
        (trx ?? db)
          .select({
            id: usersTable.id,
            username: usersTable.username,
            password: usersTable.password,
            email: usersTable.email
          })
          .from(usersTable)
          .where(and(eq(usersTable.email, email), eq(usersTable.isDeleted, 0)))
          .limit(1)
          .then((users) => users[0] ?? null)
      )
    },

    async findAllUsers(options: { page: number; pageSize: number }) {
      const { page, pageSize } = options
      const offset = (page - 1) * pageSize

      const [users, countResult] = await Promise.all([
        toResult(
          db
            .select({
              username: usersTable.username,
              email: usersTable.email
            })
            .from(usersTable)
            .where(eq(usersTable.isDeleted, 0))
            .limit(pageSize)
            .offset(offset)
        ),
        toResult(
          db
            .select({ count: sql<number>`count(*)` })
            .from(usersTable)
            .where(eq(usersTable.isDeleted, 0))
            .then((result) => result[0].count)
        )
      ])

      if (users.isErr()) return users
      if (countResult.isErr()) return countResult

      return ok({
        items: users.value,
        total: countResult.value
      })
    },

    async updatePassword(email: string, hashedPassword: string) {
      return toResult(
        db
          .update(usersTable)
          .set({ password: hashedPassword, updatedAt: sql`UNIX_TIMESTAMP()`, version: sql`version + 1` })
          .where(eq(usersTable.email, email))
      )
    },

    async createUser(userData: {
      email: string
      username: string
      password: string
      inviterCode?: number
    }) {
      return toResult(
        db.insert(usersTable).values({
          email: userData.email,
          username: userData.username,
          password: userData.password,
          inviterCode: userData.inviterCode,
          createdAt: sql`UNIX_TIMESTAMP()`,
          updatedAt: sql`UNIX_TIMESTAMP()`
        })
      )
    }
  }
}

export default fp(
  async function (fastify: FastifyInstance) {
    const repo = createUsersRepository(fastify)
    fastify.decorate('usersRepository', repo)
  },
  {
    name: 'users-repository',
    dependencies: ['db']
  }
)
