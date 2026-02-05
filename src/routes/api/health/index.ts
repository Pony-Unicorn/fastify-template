import { Type } from '@fastify/type-provider-typebox'
import { sql } from 'drizzle-orm'
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
      // 检查数据库连接
      let dbConnected = false
      try {
        // 执行简单的数据库查询来验证连接
        await fastify.db.execute(sql`SELECT 1`)
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
