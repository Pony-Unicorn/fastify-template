import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import mysql, { type Pool } from 'mysql2/promise'

declare module 'fastify' {
  export interface FastifyInstance {
    db: MySql2Database<Record<string, never>> & { $client: Pool }
  }
}

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    uri: fastify.config.DATABASE_URL,
    connectionLimit: 50
  }
}

export default fp(
  async (fastify: FastifyInstance, opts) => {
    const poolConnection = mysql.createPool(opts)

    const drizzleClient = drizzle({
      client: poolConnection
    })

    fastify.decorate('db', drizzleClient)

    fastify.addHook('onClose', async (instance) => {
      await instance.db.$client.end()
    })
  },
  {
    name: 'db',
    dependencies: ['@fastify/env']
  }
)
