import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

import {
  MessageResponseSchema,
  PagingQueryString,
  PagingQueryStringSchema
} from '../../../schemas/common.js'
import {
  Register,
  RegisterSchema,
  UpdateCredentials,
  UpdateCredentialsSchema,
  UserInfoQuery,
  UserInfoQuerySchema,
  UserInfoSchema,
  UsersListResponseSchema
} from '../../../schemas/users.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository, passwordManager, log } = fastify

  fastify.get<{ Querystring: PagingQueryString }>(
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
      const { page, page_size: pageSize } = request.query

      const result = await usersRepository.findAllUsers({
        page,
        pageSize
      })

      if (result.isErr()) {
        log.error(`Failed to fetch users: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      return {
        items: result.value.items,
        page,
        pageSize,
        total: result.value.total
      }
    }
  )

  fastify.post<{ Body: Register }>(
    '/',
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
      const existingUser = await usersRepository.findByEmail(email)
      if (existingUser.isErr()) {
        return reply.internalServerError('Database error')
      }

      if (existingUser.value) {
        return reply.conflict('User already exists')
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
        return reply.internalServerError('Database error')
      }

      reply.code(201)
      return { message: 'User registered successfully' }
    }
  )

  fastify.patch<{ Body: UpdateCredentials }>(
    '/me/password',
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

      const user = await usersRepository.findByEmail(email)

      if (user.isErr()) {
        return reply.internalServerError('Database error')
      }

      if (!user.value) {
        return reply.unauthorized('User does not exist')
      }

      const isPasswordValid = await passwordManager.compare(
        currentPassword,
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

      const hashedPassword = await passwordManager.hash(newPassword)
      const updateResult = await usersRepository.updatePassword(
        email,
        hashedPassword
      )

      if (updateResult.isErr()) {
        log.error(`Failed to update password: ${updateResult.error.message}`)
        return reply.internalServerError('Database error')
      }

      return { message: 'Password updated successfully' }
    }
  )

  fastify.get<{ Querystring: UserInfoQuery }>(
    '/me',
    {
      schema: {
        querystring: UserInfoQuerySchema,
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
