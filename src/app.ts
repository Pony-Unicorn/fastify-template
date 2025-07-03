import { join } from 'node:path'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
export const options: AppOptions = {
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          },
          level: 'debug'
        },
        {
          target: 'pino/file',
          options: { destination: './logs/info.log' },
          level: 'info'
        },
        {
          target: 'pino/file',
          options: { destination: './logs/warn.log' },
          level: 'warn'
        },
        {
          target: 'pino/file',
          options: { destination: './logs/error.log' },
          level: 'error'
        }
      ]
    }
  }
}

const serviceApp: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // This loads all external plugins defined in plugins/external
  // those should be registered first as your application plugins might depend on them
  await fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins/external'),
    options: { ...opts }
  })

  // This loads all your application plugins defined in plugins/app
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins/app'),
    options: { ...opts }
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts }
  })

  fastify.setErrorHandler((err, request, reply) => {
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

    let message = 'Internal Server Error'
    if (err.statusCode && err.statusCode < 500) {
      message = err.message
    }

    return { message }
  })

  // An attacker could search for valid URLs if your 404 error handling is not rate limited.
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500
      })
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

      reply.code(404)

      return { message: 'Not Found' }
    }
  )
}

export default serviceApp
