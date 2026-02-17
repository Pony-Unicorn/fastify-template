import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

import { MessageResponseSchema } from '../../../schemas/common.js'
import { Credentials, CredentialsSchema } from '../../../schemas/auth.js'

function getCookieDomain(corsOrigins: string): string | undefined {
  for (const origin of corsOrigins.split(',')) {
    try {
      const { hostname } = new URL(origin.trim())
      if (hostname === 'localhost' || /^\d/.test(hostname)) continue
      const parts = hostname.split('.')
      if (parts.length >= 2) return '.' + parts.slice(-2).join('.')
    } catch {
      continue
    }
  }
  return undefined
}

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository, passwordManager, log, config } = fastify
  const cookieDomain = getCookieDomain(config.CORS_ORIGINS)

  fastify.post<{ Body: Credentials }>(
    '/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      },
      schema: {
        body: CredentialsSchema,
        response: {
          200: MessageResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { email, password } = request.body

      const user = await usersRepository.findByEmail(email)

      if (user.isErr()) {
        log.error(`Login error: ${user.error.message}`)
        return reply.internalServerError('Database error')
      }

      if (!user.value) {
        return reply.unauthorized('Invalid email or password')
      }

      const isPasswordValid = await passwordManager.compare(
        password,
        user.value.password
      )

      if (!isPasswordValid) {
        return reply.unauthorized('Invalid email or password')
      }

      const token = fastify.jwt.sign({
        id: user.value.id,
        email: user.value.email
      })

      reply.setCookie(config.COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: config.NODE_ENV === 'production',
        ...(cookieDomain && { domain: cookieDomain })
      })

      return { message: 'Login successful' }
    }
  )

  fastify.post(
    '/logout',
    {
      schema: {
        response: {
          200: MessageResponseSchema
        }
      }
    },
    async function (_request, reply) {
      reply.clearCookie(config.COOKIE_NAME, {
        path: '/',
        ...(cookieDomain && { domain: cookieDomain })
      })

      return { message: 'Logout successful' }
    }
  )
}

export default plugin
