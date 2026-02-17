import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

export default fp(
  async (fastify) => {
    fastify.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify()
        } catch {
          return reply.unauthorized('Authentication required')
        }
      }
    )
  },
  {
    name: 'authenticate',
    dependencies: ['jwt']
  }
)
