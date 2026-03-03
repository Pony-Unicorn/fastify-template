import assert from 'node:assert'
import { it } from 'node:test'

import { build } from '../helper.js'

it('rejects requests from disallowed CORS origins', async (t) => {
  const originalCorsOrigins = process.env.CORS_ORIGINS
  process.env.CORS_ORIGINS = 'http://localhost:3000'
  t.after(() => {
    process.env.CORS_ORIGINS = originalCorsOrigins
  })
  const app = await build(t)

  const res = await app.inject({
    method: 'OPTIONS',
    url: '/api/',
    headers: {
      Origin: 'http://malicious-site.com',
      'Access-Control-Request-Method': 'GET'
    }
  })

  assert.strictEqual(res.statusCode, 500)
})
