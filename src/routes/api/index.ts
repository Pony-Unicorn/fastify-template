import { FastifyInstance } from 'fastify'
import { Type } from '@fastify/type-provider-typebox'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: Type.Object({
            message: Type.String()
          })
        }
      }
    },
    async function () {
      return { message: 'Welcome to the official fastify template!' }
    }
  )
}
