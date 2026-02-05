import fastify from 'fastify'
import fp from 'fastify-plugin'
import assert from 'node:assert'
import { it } from 'node:test'

import serviceApp from '../../dist/app.js'

it('should call errorHandler', async (t) => {
  const app = fastify()
  await app.register(fp(serviceApp))

  app.get('/error', () => {
    throw new Error('Kaboom!')
  })

  await app.ready()

  t.after(() => app.close())

  const res = await app.inject({
    method: 'GET',
    url: '/error'
  })

  assert.deepStrictEqual(JSON.parse(res.payload), {
    message: 'Internal Server Error'
  })
})
