import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { eq } from 'drizzle-orm'

import { usersTable } from '../../../db/schema.js'
import { type MySqlDBTransaction } from '../../../db/types.js'
import { toResult } from '../../../utils/result.js'

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
          .where(eq(usersTable.email, email))
          .limit(1)
          .then((users) => users[0] ?? null)
      )
    },

    async updatePassword(email: string, hashedPassword: string) {
      return toResult(
        db
          .update(usersTable)
          .set({ password: hashedPassword })
          .where(eq(usersTable.email, email))
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
