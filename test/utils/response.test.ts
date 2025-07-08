import assert from 'node:assert'
import { it, describe } from 'node:test'

import { toSuccessResponse } from '../../dist/src/utils/response.js'

describe('Response Utils', () => {
  it('should create a successful response with OK status', () => {
    const result = toSuccessResponse({ data: 'test' })
    
    assert.strictEqual(result.statusCode, 200)
    assert.strictEqual(result.message, 'OK')
    assert.deepStrictEqual(result.result, { data: 'test' })
  })

  it('should create a successful response with CREATED status', () => {
    const result = toSuccessResponse({ id: 1 }, 'CREATED')
    
    assert.strictEqual(result.statusCode, 201)
    assert.strictEqual(result.message, 'Created')
    assert.deepStrictEqual(result.result, { id: 1 })
  })

  it('should handle null result', () => {
    const result = toSuccessResponse(null)
    
    assert.strictEqual(result.statusCode, 200)
    assert.strictEqual(result.message, 'OK')
    assert.strictEqual(result.result, null)
  })

  it('should handle complex data structures', () => {
    const complexData = {
      user: { id: 1, name: 'Test User' },
      permissions: ['read', 'write'],
      metadata: { created: new Date().toISOString() }
    }
    
    const result = toSuccessResponse(complexData)
    
    assert.strictEqual(result.statusCode, 200)
    assert.strictEqual(result.message, 'OK')
    assert.deepStrictEqual(result.result, complexData)
  })
})