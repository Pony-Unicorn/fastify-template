import Fastify, { InjectOptions, LightMyRequestResponse } from 'fastify'
import fp from 'fastify-plugin'
import assert from 'node:assert'
import { TestContext } from 'node:test'

import serviceApp from '../src/app.js'

declare module 'fastify' {
  interface FastifyInstance {
    login: typeof login
    injectWithLogin: typeof injectWithLogin
  }
}

export function expectValidationError(
  res: LightMyRequestResponse,
  expectedMessage: string
) {
  assert.strictEqual(res.statusCode, 400)
  const { message } = JSON.parse(res.payload)
  assert.strictEqual(message, expectedMessage)
}

async function login(this: FastifyInstance, email: string) {
  const res = await this.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: 'Password123$' }
  })

  const cookie = res.cookies.find((c) => c.name === this.config.COOKIE_NAME)

  if (!cookie) {
    throw new Error('Failed to retrieve session cookie.')
  }

  return cookie.value
}

async function injectWithLogin(
  this: FastifyInstance,
  email: string,
  opts: InjectOptions
) {
  const cookieValue = await this.login(email)

  opts.cookies = {
    ...opts.cookies,
    [this.config.COOKIE_NAME]: cookieValue
  }

  return this.inject({ ...opts })
}

export async function build(t?: TestContext) {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        coerceTypes: 'array',
        removeAdditional: 'all'
      }
    }
  })

  await app.register(fp(serviceApp))

  app.login = login
  app.injectWithLogin = injectWithLogin

  await app.ready()

  if (t) {
    t.after(() => app.close())
  }

  return app
}
