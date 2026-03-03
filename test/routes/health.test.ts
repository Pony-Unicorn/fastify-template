import assert from 'node:assert'
import { describe, it } from 'node:test'

import { build } from '../helper.js'

describe('GET /api/health', () => {
  it('returns 200 with correct structure', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/health' })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.status, 'ok')
    assert.strictEqual(typeof payload.timestamp, 'string')
    assert.ok(new Date(payload.timestamp).getTime() > 0, 'timestamp should be a valid ISO date')
    assert.strictEqual(typeof payload.uptime, 'number')
    assert.ok(payload.uptime >= 0)
  })

  it('reports database connection status', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/health' })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.ok(payload.database !== undefined, 'database field should be present')
    assert.strictEqual(typeof payload.database.connected, 'boolean')
    assert.strictEqual(payload.database.connected, true, 'database should be connected in test environment')
  })

  it('is accessible without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/health' })

    assert.strictEqual(res.statusCode, 200)
  })
})
