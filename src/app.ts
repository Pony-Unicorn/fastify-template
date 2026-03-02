import fastifyAutoload from '@fastify/autoload'
import { FastifyError, FastifyInstance, FastifyPluginOptions } from 'fastify'
import path from 'node:path'

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/external')
  })

  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/app'),
    options: opts
  })

  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    options: opts
  })

  fastify.setErrorHandler((err: FastifyError, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params
        }
      },
      'Unhandled error occurred'
    )

    reply.code(err.statusCode ?? 500)

    return {
      message: err.statusCode && err.statusCode < 500 ? err.message : 'Internal Server Error'
    }
  })

  // Rate-limit 404 to prevent URL enumeration attacks
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({ max: 3, timeWindow: 500 })
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params
          }
        },
        'Resource not found'
      )

      return reply.notFound()
    }
  )
}
