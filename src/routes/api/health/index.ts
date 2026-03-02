import { Type } from '@fastify/type-provider-typebox'
import { sql } from 'kysely'
import { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: Type.Object({
            status: Type.String(),
            timestamp: Type.String(),
            uptime: Type.Number(),
            database: Type.Optional(
              Type.Object({
                connected: Type.Boolean()
              })
            )
          })
        }
      }
    },
    async function () {
      let dbConnected = false
      try {
        await sql`SELECT 1`.execute(fastify.kysely)
        dbConnected = true
      } catch (error) {
        fastify.log.error({ err: error }, 'Database health check failed')
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbConnected
        }
      }
    }
  )
}
