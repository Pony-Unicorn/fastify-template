import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { sql } from 'kysely'
import { paginateResults, toResult } from '../../../utils/result.js'

declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>
  }
}

export function createUsersRepository(fastify: FastifyInstance) {
  const db = fastify.kysely

  return {
    async findByEmail(email: string) {
      return toResult(
        db
          .selectFrom('users')
          .select(['id', 'username', 'password', 'email'])
          .where('email', '=', email)
          .where('deleted_at', 'is', null)
          .executeTakeFirst()
          .then((user) => user ?? null)
      )
    },

    async findAllUsers(options: { page: number; pageSize: number }) {
      const { page, pageSize } = options
      const offset = (page - 1) * pageSize

      return paginateResults(
        toResult(
          db
            .selectFrom('users')
            .select(['username', 'email'])
            .where('deleted_at', 'is', null)
            .limit(pageSize)
            .offset(offset)
            .execute()
        ),
        toResult(
          db
            .selectFrom('users')
            .select(db.fn.count<number>('id').as('count'))
            .where('deleted_at', 'is', null)
            .executeTakeFirstOrThrow()
            .then((result) => Number(result.count))
        )
      )
    },

    async updatePassword(email: string, hashedPassword: string) {
      return toResult(
        db
          .updateTable('users')
          .set({
            password: hashedPassword,
            updated_at: sql<number>`unixepoch()`,
            version: sql<number>`version + 1`
          })
          .where('email', '=', email)
          .execute()
      )
    },

    async createUser(userData: {
      email: string
      username: string
      password: string
      inviterCode?: number
    }) {
      return toResult(
        db
          .insertInto('users')
          .values({
            email: userData.email,
            username: userData.username,
            password: userData.password,
            inviter_code: userData.inviterCode ?? null,
            created_at: sql<number>`unixepoch()`,
            updated_at: sql<number>`unixepoch()`
          })
          .execute()
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
    dependencies: ['kysely']
  }
)
