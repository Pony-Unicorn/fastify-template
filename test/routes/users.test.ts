import assert from 'node:assert'
import { describe, it } from 'node:test'

import { build } from '../helper.js'

describe('GET /api/users', () => {
  it('returns 401 without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/users' })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns paginated users list when authenticated', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'GET',
      url: '/api/users'
    })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.ok(Array.isArray(payload.items))
    assert.ok(typeof payload.total === 'number')
    assert.ok(typeof payload.page === 'number')
    assert.ok(typeof payload.pageSize === 'number')
  })

  it('respects pagination query parameters', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'GET',
      url: '/api/users?page=1&page_size=2'
    })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.ok(Array.isArray(payload.items))
    assert.ok(payload.items.length <= 2)
    assert.strictEqual(payload.page, 1)
    assert.strictEqual(payload.pageSize, 2)
  })
})

describe('POST /api/users', () => {
  it('registers a new user and returns 201', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        email: `test_${Date.now()}@example.com`,
        username: 'testuser',
        password: 'Password123$'
      }
    })

    assert.strictEqual(res.statusCode, 201)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'User registered successfully' })
  })

  it('returns 409 for duplicate email', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'basic@example.com',
        username: 'testuser',
        password: 'Password123$'
      }
    })

    assert.strictEqual(res.statusCode, 409)
  })

  it('returns 400 for invalid email', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'not-an-email', username: 'testuser', password: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 400)
  })

  it('returns 400 for weak password', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'valid@example.com', username: 'testuser', password: 'weak' }
    })

    assert.strictEqual(res.statusCode, 400)
  })

  it('returns 400 for missing username', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'valid@example.com', password: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 400)
  })
})

describe('GET /api/users/me', () => {
  it('returns 401 without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/users/me' })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns current user info when authenticated', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'GET',
      url: '/api/users/me'
    })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.email, 'basic@example.com')
    assert.strictEqual(typeof payload.username, 'string')
  })
})

describe('PATCH /api/users/me/password', () => {
  it('returns 401 without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/users/me/password',
      payload: { currentPassword: 'Password123$', newPassword: 'NewPassword456!' }
    })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns 400 when new password equals current password', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('moderator@example.com', {
      method: 'PATCH',
      url: '/api/users/me/password',
      payload: { currentPassword: 'Password123$', newPassword: 'Password123$' }
    })

    assert.strictEqual(res.statusCode, 400)
  })

  it('returns 401 for wrong current password', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('admin@example.com', {
      method: 'PATCH',
      url: '/api/users/me/password',
      payload: { currentPassword: 'WrongPassword1!', newPassword: 'NewPassword456!' }
    })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns 200 on successful password update', async (t) => {
    const app = await build(t)

    // Register a fresh user to avoid polluting shared seed users
    const email = `pwtest_${Date.now()}@example.com`
    await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email, username: 'pwtest', password: 'Password123$' }
    })

    const res = await app.injectWithLogin(email, {
      method: 'PATCH',
      url: '/api/users/me/password',
      payload: { currentPassword: 'Password123$', newPassword: 'NewPassword456!' }
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Password updated successfully' })
  })
})
