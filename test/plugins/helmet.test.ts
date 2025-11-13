import assert from 'node:assert'
import { describe, it } from 'node:test'

import { build } from '../helper.js'

describe('Helmet Plugin', () => {
  it('should add X-Frame-Options header', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.headers['x-frame-options'])
    assert.strictEqual(res.headers['x-frame-options'], 'SAMEORIGIN')
  })

  it('should add Content-Security-Policy header', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.headers['content-security-policy'])
  })

  it('should add X-Content-Type-Options header', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.headers['x-content-type-options'])
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff')
  })
})
