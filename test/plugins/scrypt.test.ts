import Fastify from 'fastify'
import assert from 'node:assert'
import { describe, it } from 'node:test'

import passwordManagerPlugin from '../../src/plugins/app/password-manager.js'

describe('password-manager plugin', () => {
  it('hash returns a string', async (t) => {
    const app = Fastify({ logger: false })
    app.register(passwordManagerPlugin)
    await app.ready()
    t.after(() => app.close())

    const hash = await app.passwordManager.hash('test_password')
    assert.strictEqual(typeof hash, 'string')
  })

  it('compare returns true for correct password', async (t) => {
    const app = Fastify({ logger: false })
    app.register(passwordManagerPlugin)
    await app.ready()
    t.after(() => app.close())

    const hash = await app.passwordManager.hash('test_password')
    const isValid = await app.passwordManager.compare('test_password', hash)
    assert.ok(isValid)
  })

  it('compare returns false for wrong password', async (t) => {
    const app = Fastify({ logger: false })
    app.register(passwordManagerPlugin)
    await app.ready()
    t.after(() => app.close())

    const hash = await app.passwordManager.hash('test_password')
    const isInvalid = await app.passwordManager.compare('wrong_password', hash)
    assert.ok(!isInvalid)
  })

  it('compare rejects on malformed hash', async (t) => {
    const app = Fastify({ logger: false })
    app.register(passwordManagerPlugin)
    await app.ready()
    t.after(() => app.close())

    await assert.rejects(() => app.passwordManager.compare('test_password', 'malformed_hash'))
  })
})
