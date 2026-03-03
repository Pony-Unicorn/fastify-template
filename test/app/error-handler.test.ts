import Fastify from 'fastify'
import fp from 'fastify-plugin'
import assert from 'node:assert'
import { it } from 'node:test'

import serviceApp from '../../src/app.js'

it('error handler returns 500 for unhandled errors', async (t) => {
  const app = Fastify({ logger: false })
  await app.register(fp(serviceApp))

  app.get('/error', () => {
    throw new Error('Kaboom!')
  })

  await app.ready()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/error' })

  assert.strictEqual(res.statusCode, 500)
  assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Internal Server Error' })
})

it('error handler returns original message for 4xx errors', async (t) => {
  const app = Fastify({ logger: false })
  await app.register(fp(serviceApp))
  await app.ready()
  t.after(() => app.close())

  const res = await app.inject({ method: 'GET', url: '/api/this-does-not-exist' })

  assert.strictEqual(res.statusCode, 404)
  assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Not Found' })
})
