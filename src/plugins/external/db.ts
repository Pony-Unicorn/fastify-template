import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import mysql, { type Pool } from 'mysql2/promise'

declare module 'fastify' {
  export interface FastifyInstance {
    db: MySql2Database<Record<string, never>> & { $client: Pool }
  }
}

export default fp(
  async (fastify: FastifyInstance, _opts) => {
    if (!fastify.hasDecorator('db')) {
      const poolConnection = mysql.createPool({
        uri: fastify.config.DATABASE_URL,
        connectionLimit: 20
      })

      const drizzleClient = drizzle({
        client: poolConnection
      })

      fastify.decorate('db', drizzleClient)

      fastify.addHook('onClose', async (instance) => {
        await instance.db.$client.end()
      })
    } else {
      throw new Error(
        'A `db` decorator is already registered—please avoid registering it more than once.'
      )
    }
  },
  {
    name: 'db',
    dependencies: ['@fastify/env']
  }
)
