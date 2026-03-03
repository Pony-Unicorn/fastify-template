import assert from 'node:assert'
import { describe, it } from 'node:test'

import { build } from '../helper.js'

describe('POST /api/auth/login', () => {
  it('returns 200 and sets httpOnly cookie for valid credentials', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'basic@example.com', password: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Login successful' })

    const cookie = res.cookies.find((c) => c.name === app.config.COOKIE_NAME)
    assert.ok(cookie, 'session cookie should be set')
    assert.ok(cookie!.httpOnly)
  })

  it('returns 401 for wrong password', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'basic@example.com', password: 'WrongPassword!' }
    })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns 401 for non-existent user', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@example.com', password: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns 400 for missing required fields', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'basic@example.com' }
    })

    assert.strictEqual(res.statusCode, 400)
  })

  it('returns 400 for missing email', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 400)
  })

  it('sets cookie domain for production CORS origins', async (t) => {
    const originalCorsOrigins = process.env.CORS_ORIGINS
    process.env.CORS_ORIGINS = 'https://example.com'
    t.after(() => {
      process.env.CORS_ORIGINS = originalCorsOrigins
    })
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'basic@example.com', password: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 200)
    const cookie = res.cookies.find((c) => c.name === app.config.COOKIE_NAME)
    assert.ok(cookie, 'session cookie should be set')
    assert.strictEqual(cookie!.domain, '.example.com', 'cookie domain should match CORS origin')
  })
})

describe('POST /api/auth/logout', () => {
  it('returns 200 with logout message', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Logout successful' })
  })

  it('clears the session cookie', async (t) => {
    const app = await build(t)

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'basic@example.com', password: 'Password123$' }
    })
    const sessionCookie = loginRes.cookies.find((c) => c.name === app.config.COOKIE_NAME)
    assert.ok(sessionCookie, 'should have session cookie after login')

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: { [app.config.COOKIE_NAME]: sessionCookie!.value }
    })

    assert.strictEqual(res.statusCode, 200)
    const clearedCookie = res.cookies.find((c) => c.name === app.config.COOKIE_NAME)
    assert.ok(clearedCookie, 'Set-Cookie header should be present to clear cookie')
    assert.strictEqual(clearedCookie!.value, '', 'cookie value should be empty after logout')
  })
})
