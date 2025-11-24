import cors from '@fastify/cors'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

/**
 * This plugin enables the use of CORS with origins from environment variables.
 *
 * @see {@link https://github.com/fastify/fastify-cors}
 */
const plugin: FastifyPluginAsync = async (fastify) => {
  const corsOrigins = fastify.config.CORS_ORIGINS.split(',').map((origin) =>
    origin.trim()
  )
  const CORS_ALLOW_LIST = new Set(corsOrigins)

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Only allow origins in the allowlist
      cb(null, !!origin && CORS_ALLOW_LIST.has(origin))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  })
}

export default fp(plugin, {
  name: 'cors',
  dependencies: ['@fastify/env']
})
