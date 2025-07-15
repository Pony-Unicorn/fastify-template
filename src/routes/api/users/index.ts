import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'

import ERROR_CODES from '../../../config/error-codes.js'
import {
  DefaultResponseJsonSchema,
  EmailSchema,
  ResponseJsonSchema
} from '../../../schemas/common.js'
import {
  RegisterSchema,
  UpdateCredentialsSchema
} from '../../../schemas/users.js'
import { sendError, toSuccessResponse } from '../../../utils/response.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository, passwordManager, log } = fastify

  fastify.post(
    '/register',
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '5 minutes'
        }
      },
      schema: {
        body: RegisterSchema,
        response: {
          201: ResponseJsonSchema,
          default: DefaultResponseJsonSchema
        }
      }
    },
    async function (request, reply) {
      const { email, username, password, inviterCode } = request.body

      // 检查用户是否已存在
      const existingUser = await usersRepository.findByEmail(email)
      if (existingUser.isErr()) {
        return sendError(reply, ERROR_CODES.DATABASE_ERROR)
      }

      if (existingUser.value) {
        return sendError(reply, ERROR_CODES.USER_ALREADY_EXISTS)
      }

      // 加密密码
      const hashedPassword = await passwordManager.hash(password)

      // 创建用户
      const createResult = await usersRepository.createUser({
        email,
        username,
        password: hashedPassword,
        inviterCode
      })

      if (createResult.isErr()) {
        log.error(`Failed to create user: ${createResult.error.message}`)
        return sendError(reply, ERROR_CODES.DATABASE_ERROR)
      }

      reply.code(201)
      return toSuccessResponse(null)
    }
  )
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
          default: DefaultResponseJsonSchema
        }
      }
    },
    async function (request, reply) {
      log.debug(`user email: ${request.query.email}`)

      const user = await usersRepository.findByEmail(request.query.email)

      if (user.isErr()) {
        log.error(`Email ${request.query.email}, Error ${user.error.message}`)

        return sendError(reply, ERROR_CODES.DATABASE_ERROR)
      }

      if (!user.value) {
        return sendError(reply, ERROR_CODES.USER_NOT_FOUND)
      }

      return toSuccessResponse(user.value)
    }
  )
}

export default plugin
