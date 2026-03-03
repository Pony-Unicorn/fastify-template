import Fastify from 'fastify'
import assert from 'node:assert'
import { test } from 'node:test'

import passwordManagerPlugin from '../../src/plugins/app/password-manager.js'

test('password-manager: hash and compare', async (t) => {
  const app = Fastify({ logger: false })
  app.register(passwordManagerPlugin)
  await app.ready()
  t.after(() => app.close())

  const password = 'test_password'
  const { passwordManager } = app

  const hash = await passwordManager.hash(password)
  assert.strictEqual(typeof hash, 'string')

  const isValid = await passwordManager.compare(password, hash)
  assert.ok(isValid)

  const isInvalid = await passwordManager.compare('wrong_password', hash)
  assert.ok(!isInvalid)

  await assert.rejects(() => passwordManager.compare(password, 'malformed_hash'))
})
