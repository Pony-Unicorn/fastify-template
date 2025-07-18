import { FastifyInstance } from 'fastify'
import fastifyRateLimit from '@fastify/rate-limit'

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    max: fastify.config.RATE_LIMIT_MAX,
    timeWindow: '1 minute'
  }
}

/**
 * This plugins is low overhead rate limiter for your routes.
 *
 * @see {@link https://github.com/fastify/fastify-rate-limit}
 */
export default fastifyRateLimit
