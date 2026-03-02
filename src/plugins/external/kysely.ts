import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import BetterSqlite3 from 'better-sqlite3'
import { Kysely, SqliteDialect, sql } from 'kysely'

import { type DB } from 'kysely-codegen'

declare module 'fastify' {
  export interface FastifyInstance {
    kysely: Kysely<DB>
  }
}

export default fp(
  async (fastify: FastifyInstance, _opts) => {
    const sqlite = new BetterSqlite3(fastify.config.DATABASE_URL)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    const kysely = new Kysely<DB>({
      dialect: new SqliteDialect({ database: sqlite })
    })

    await sql`SELECT 1`.execute(kysely)

    fastify.decorate('kysely', kysely)

    fastify.addHook('onClose', async () => {
      await kysely.destroy()
    })
  },
  {
    name: 'kysely',
    dependencies: ['@fastify/env']
  }
)
