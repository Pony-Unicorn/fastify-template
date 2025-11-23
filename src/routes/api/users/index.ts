import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'

import {
  EmailSchema,
  MessageResponseSchema,
  PagingQueryStringSchema
} from '../../../schemas/common.js'
import {
  RegisterSchema,
  UpdateCredentialsSchema,
  UserInfoSchema,
  UsersListResponseSchema
} from '../../../schemas/users.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository, passwordManager, log } = fastify

  fastify.get(
    '/',
    {
      schema: {
        querystring: PagingQueryStringSchema,
        response: {
          200: UsersListResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { page = 1, page_size = 20 } = request.query

      const result = await usersRepository.findAllUsers({
        page,
        pageSize: page_size
      })

      if (result.isErr()) {
        log.error(`Failed to fetch users: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      return {
        items: result.value.items,
        page,
        pageSize: page_size,
        total: result.value.total
      }
    }
  )

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
          201: MessageResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { email, username, password, inviterCode } = request.body

      // 检查用户是否已存在
      const existingUser = await usersRepository.findByEmail(email!)
      if (existingUser.isErr()) {
        return reply.internalServerError('Database error')
      }

      if (existingUser.value) {
        return reply.conflict('User already exists')
      }

      // 加密密码
      const hashedPassword = await passwordManager.hash(password!)

      // 创建用户
      const createResult = await usersRepository.createUser({
        email: email!,
        username: username!,
        password: hashedPassword,
        inviterCode
      })

      if (createResult.isErr()) {
        log.error(`Failed to create user: ${createResult.error.message}`)
        return reply.internalServerError('Database error')
      }

      reply.code(201)
      return { message: 'successfully' }
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
          200: MessageResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { newPassword, currentPassword, email } = request.body

      const user = await usersRepository.findByEmail(email!)

      if (user.isErr()) {
        return reply.internalServerError('Database error')
      }

      if (!user.value) {
        return reply.unauthorized('User does not exist')
      }

      const isPasswordValid = await passwordManager.compare(
        currentPassword!,
        user.value.password
      )

      if (!isPasswordValid) {
        return reply.unauthorized('Invalid current password')
      }

      if (newPassword === currentPassword) {
        return reply.badRequest(
          'New password cannot be the same as the current password'
        )
      }

      const hashedPassword = await passwordManager.hash(newPassword!)
      await usersRepository.updatePassword(email!, hashedPassword)

      return { message: 'successfully' }
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
          200: UserInfoSchema
        }
      }
    },
    async function (request, reply) {
      log.debug(`user email: ${request.query.email}`)

      const user = await usersRepository.findByEmail(request.query.email)

      if (user.isErr()) {
        log.error(`Email ${request.query.email}, Error ${user.error.message}`)
        return reply.internalServerError('Database error')
      }

      if (!user.value) {
        return reply.notFound()
      }

      return {
        username: user.value.username,
        email: user.value.email
      }
    }
  )
}

export default plugin
