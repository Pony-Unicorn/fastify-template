import assert from 'node:assert'
import { it } from 'node:test'

import { build } from '../helper.js'

it('should correctly handle CORS preflight requests', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'OPTIONS',
    url: '/',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  })

  assert.strictEqual(res.statusCode, 204)
  assert.strictEqual(
    res.headers['access-control-allow-methods'],
    'GET, POST, PUT, DELETE'
  )
})
