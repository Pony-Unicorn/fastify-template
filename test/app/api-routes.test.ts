import assert from 'node:assert'
import { describe, it } from 'node:test'

import { build } from '../helper.js'

describe('API Routes', () => {
  it('should return welcome message from root API endpoint', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(
      payload.message,
      'Welcome to the official fastify template!'
    )
  })

  it('should return 404 for unknown API endpoints', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'GET',
      url: '/api/unknown-endpoint'
    })

    assert.strictEqual(res.statusCode, 404)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.message, 'Not Found')
  })

  it('should handle POST method correctly', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/'
    })

    // POST is not defined on the root API endpoint, so returns 404
    assert.strictEqual(res.statusCode, 404)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.message, 'Not Found')
  })
})
