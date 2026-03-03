import assert from 'node:assert'
import { describe, it } from 'node:test'

import { build } from '../helper.js'

// Helper: create a post as the given user and return its id
async function createPost(
  app: Awaited<ReturnType<typeof build>>,
  email: string,
  payload = { title: 'Test Post', content: 'Test content' }
) {
  const res = await app.injectWithLogin(email, {
    method: 'POST',
    url: '/api/posts',
    payload
  })
  assert.strictEqual(res.statusCode, 201)
  return JSON.parse(res.payload) as { id: number }
}

describe('GET /api/posts', () => {
  it('returns paginated list without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/posts' })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.ok(Array.isArray(payload.items))
    assert.ok(typeof payload.total === 'number')
    assert.ok(typeof payload.page === 'number')
    assert.ok(typeof payload.pageSize === 'number')
  })

  it('returns only published posts', async (t) => {
    const app = await build(t)

    // Create and publish a post
    const { id } = await createPost(app, 'basic@example.com')
    await app.injectWithLogin('basic@example.com', {
      method: 'PATCH',
      url: `/api/posts/${id}`,
      payload: { status: 'published' }
    })

    const res = await app.inject({ method: 'GET', url: '/api/posts' })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.ok(payload.total >= 1)
    assert.ok(payload.items.every((p: { status: string }) => p.status === 'published'))
  })

  it('respects pagination query parameters', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/posts?page=1&page_size=5' })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.page, 1)
    assert.strictEqual(payload.pageSize, 5)
  })
})

describe('POST /api/posts', () => {
  it('returns 401 without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'POST',
      url: '/api/posts',
      payload: { title: 'Hello', content: 'World' }
    })

    assert.strictEqual(res.statusCode, 401)
  })

  it('creates a draft post and returns 201 when authenticated', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'POST',
      url: '/api/posts',
      payload: { title: 'My Post', content: 'Some content here' }
    })

    assert.strictEqual(res.statusCode, 201)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.title, 'My Post')
    assert.strictEqual(payload.content, 'Some content here')
    assert.strictEqual(payload.status, 'draft')
    assert.strictEqual(payload.viewCount, 0)
    assert.strictEqual(payload.publishedAt, null)
    assert.ok(typeof payload.id === 'number')
  })

  it('returns 400 for missing title', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'POST',
      url: '/api/posts',
      payload: { content: 'No title here' }
    })

    assert.strictEqual(res.statusCode, 400)
  })

  it('returns 400 for missing content', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'POST',
      url: '/api/posts',
      payload: { title: 'No content' }
    })

    assert.strictEqual(res.statusCode, 400)
  })
})

describe('GET /api/posts/:id', () => {
  it('returns 404 for non-existent post', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'GET', url: '/api/posts/999999' })

    assert.strictEqual(res.statusCode, 404)
  })

  it('returns post by id without authentication', async (t) => {
    const app = await build(t)

    const { id } = await createPost(app, 'basic@example.com')
    const res = await app.inject({ method: 'GET', url: `/api/posts/${id}` })

    assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.strictEqual(payload.id, id)
    assert.strictEqual(payload.title, 'Test Post')
  })
})

describe('PATCH /api/posts/:id', () => {
  it('returns 401 without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/posts/1',
      payload: { title: 'Updated' }
    })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns 404 for non-existent post', async (t) => {
    const app = await build(t)

    const res = await app.injectWithLogin('basic@example.com', {
      method: 'PATCH',
      url: '/api/posts/999999',
      payload: { title: 'Updated' }
    })

    assert.strictEqual(res.statusCode, 404)
  })

  it('returns 404 when not the owner', async (t) => {
    const app = await build(t)

    const { id } = await createPost(app, 'basic@example.com')
    const res = await app.injectWithLogin('moderator@example.com', {
      method: 'PATCH',
      url: `/api/posts/${id}`,
      payload: { title: 'Hijacked' }
    })

    assert.strictEqual(res.statusCode, 404)
  })

  it('updates post fields when authenticated as owner', async (t) => {
    const app = await build(t)

    const { id } = await createPost(app, 'basic@example.com')
    const res = await app.injectWithLogin('basic@example.com', {
      method: 'PATCH',
      url: `/api/posts/${id}`,
      payload: { title: 'Updated Title', status: 'published' }
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Post updated successfully' })

    // Verify the update
    const getRes = await app.inject({ method: 'GET', url: `/api/posts/${id}` })
    const post = JSON.parse(getRes.payload)
    assert.strictEqual(post.title, 'Updated Title')
    assert.strictEqual(post.status, 'published')
    assert.ok(typeof post.publishedAt === 'number')
  })
})

describe('DELETE /api/posts/:id', () => {
  it('returns 401 without authentication', async (t) => {
    const app = await build(t)

    const res = await app.inject({ method: 'DELETE', url: '/api/posts/1' })

    assert.strictEqual(res.statusCode, 401)
  })

  it('returns 404 when not the owner', async (t) => {
    const app = await build(t)

    const { id } = await createPost(app, 'basic@example.com')
    const res = await app.injectWithLogin('moderator@example.com', {
      method: 'DELETE',
      url: `/api/posts/${id}`
    })

    assert.strictEqual(res.statusCode, 404)
  })

  it('soft-deletes post when authenticated as owner', async (t) => {
    const app = await build(t)

    const { id } = await createPost(app, 'basic@example.com')
    const res = await app.injectWithLogin('basic@example.com', {
      method: 'DELETE',
      url: `/api/posts/${id}`
    })

    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.payload), { message: 'Post deleted successfully' })

    // Verify the post is no longer accessible
    const getRes = await app.inject({ method: 'GET', url: `/api/posts/${id}` })
    assert.strictEqual(getRes.statusCode, 404)
  })
})
