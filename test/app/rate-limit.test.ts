import assert from 'node:assert'
import { it } from 'node:test'

import { build } from '../helper.js'

it('should be rate limited', async (t) => {
  // Set a low rate limit for testing
  process.env.RATE_LIMIT_MAX = '4'

  const app = await build(t)

  // Make requests up to the rate limit (4)
  for (let i = 0; i < 4; i++) {
    const res = await app.inject({
      method: 'GET',
      url: '/api/'
    })

    assert.strictEqual(res.statusCode, 200)
  }

  // This request should be rate limited
  const res = await app.inject({
    method: 'GET',
    url: '/api/'
  })

  assert.strictEqual(res.statusCode, 429)
})
