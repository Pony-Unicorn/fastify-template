import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'

import { EmailSchema, ResponseJsonSchema } from '../../../schemas/common.js'
import { UpdateCredentialsSchema } from '../../../schemas/users.js'
import { toErrorResponse, toSuccessResponse } from '../../../utils/response.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository, passwordManager, log } = fastify
  fastify.put(
    '/update-password',
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 minute'
        }
      },
      schema: {
        body: UpdateCredentialsSchema,
        response: {
          200: ResponseJsonSchema,
          401: Type.Object({
            message: Type.String()
          })
        }
      }
    },
    async function (request, reply) {
      const { newPassword, currentPassword, email } = request.body

      const user = await usersRepository.findByEmail(email)

      if (user.isErr() || !user.value) {
        return reply.code(401).send({ message: 'User does not exist.' })
      }

      const isPasswordValid = await passwordManager.compare(
        currentPassword,
        user.value.password
      )

      if (!isPasswordValid) {
        return reply.code(401).send({ message: 'Invalid current password.' })
      }

      if (newPassword === currentPassword) {
        return reply.code(400).send({
          message: 'New password cannot be the same as the current password.'
        })
      }

      const hashedPassword = await passwordManager.hash(newPassword)
      await usersRepository.updatePassword(email, hashedPassword)

      return toSuccessResponse(null)
    }
  )

  fastify.get(
    '/info',
    {
      schema: {
        querystring: Type.Object({
          email: EmailSchema
        }),
        response: {
          200: Type.Composite([
            ResponseJsonSchema,
            Type.Object({
              result: Type.Object({
                username: Type.String(),
                email: Type.String()
              })
            })
          ]),
          401: Type.Object({
            message: Type.String()
          })
        }
      }
    },
    async function (request, reply) {
      log.debug(`user email: ${request.query.email}`)

      const user = await usersRepository.findByEmail(request.query.email)

      if (user.isErr()) {
        log.error(`Email ${request.query.email}, Error ${user.error.message}`)
        return reply.code(404).send({ message: 'User does not exist.' })
      }

      if (!user.value) {
        return toErrorResponse(-1, 'User does not exist.')
      }

      return toSuccessResponse(user.value)
    }
  )
}

export default plugin
