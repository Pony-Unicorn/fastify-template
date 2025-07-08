import assert from 'node:assert'
import { it, describe } from 'node:test'

import { build } from '../helper.js'

describe('Security', () => {
  it('should include security headers', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 200)
    
    // Check for security headers from helmet
    assert.ok(res.headers['x-frame-options'])
    assert.ok(res.headers['x-content-type-options'])
    assert.ok(res.headers['x-xss-protection'])
  })

  it('should handle CORS for disallowed origins', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/',
      headers: {
        Origin: 'http://malicious-site.com',
        'Access-Control-Request-Method': 'GET'
      }
    })

    // Should reject with 500 due to CORS error
    assert.strictEqual(res.statusCode, 500)
  })

  it('should enforce rate limiting on multiple requests', async (t) => {
    // Set a low rate limit for testing
    process.env.RATE_LIMIT_MAX = '2'
    
    const app = await build(t)

    // First two requests should succeed
    for (let i = 0; i < 2; i++) {
      const res = await app.inject({
        method: 'GET',
        url: '/api/'
      })
      assert.strictEqual(res.statusCode, 200)
    }

    // Third request should be rate limited
    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 429)
  })
})