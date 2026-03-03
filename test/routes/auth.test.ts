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
})

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears cookie', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Logout successful' })
  })
})
