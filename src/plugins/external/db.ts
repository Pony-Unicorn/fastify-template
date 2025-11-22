import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import mysql, { type Pool } from 'mysql2/promise'

declare module 'fastify' {
  export interface FastifyInstance {
    db: MySql2Database<Record<string, never>> & { $client: Pool }
  }
}

interface DbPluginOptions {
  uri: string
  connectionLimit: number
}

export const autoConfig = (fastify: FastifyInstance): DbPluginOptions => {
  return {
    uri: fastify.config.DATABASE_URL,
    connectionLimit: 20
  }
}

export default fp(
  async (fastify: FastifyInstance, opts: DbPluginOptions) => {
    if (!fastify.hasDecorator('db')) {
      const { uri, connectionLimit } = opts

      const poolConnection = mysql.createPool({ uri, connectionLimit })

      const drizzleClient = drizzle({
        client: poolConnection
      })

      fastify.decorate('db', drizzleClient)

      fastify.addHook('onClose', async (instance) => {
        await instance.db.$client.end()
      })
    } else {
      throw new Error(
        'A `db` decorator has already been registered, please ensure you are not registering multiple instances of this plugin'
      )
    }
  },
  {
    name: 'db',
    dependencies: ['@fastify/env']
  }
)
