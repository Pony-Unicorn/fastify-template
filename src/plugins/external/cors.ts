import cors from '@fastify/cors'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

/**
 * This plugin enables the use of CORS with origins from environment variables.
 *
 * @see {@link https://github.com/fastify/fastify-cors}
 */
const plugin: FastifyPluginAsync = async (fastify) => {
  const corsOrigins = fastify.config.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
  const CORS_ALLOW_LIST = new Set(corsOrigins)
  const allowAllOrigins = CORS_ALLOW_LIST.size === 0

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow non-browser requests (no Origin), and allow all if no allowlist is configured.
      if (!origin || allowAllOrigins) {
        cb(null, true)
        return
      }

      // Reject origins not in the allowlist
      if (!CORS_ALLOW_LIST.has(origin)) {
        cb(new Error('Origin not allowed'), false)
        return
      }

      cb(null, true)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  })
}

export default fp(plugin, {
  name: 'cors',
  dependencies: ['@fastify/env']
})
