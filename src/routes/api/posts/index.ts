import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

import {
  MessageResponseSchema,
  PagingQueryString,
  PagingQueryStringSchema
} from '../../../schemas/common.js'
import {
  CreatePost,
  CreatePostSchema,
  PostIdParams,
  PostIdParamsSchema,
  PostResponseSchema,
  PostsListResponseSchema,
  UpdatePost,
  UpdatePostSchema
} from '../../../schemas/posts.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { postsRepository, log } = fastify

  // GET /api/posts — list published posts (public)
  fastify.get<{ Querystring: PagingQueryString }>(
    '/',
    {
      schema: {
        querystring: PagingQueryStringSchema,
        response: {
          200: PostsListResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { page, page_size: pageSize } = request.query

      const result = await postsRepository.findPublished({ page, pageSize })

      if (result.isErr()) {
        log.error(`Failed to fetch posts: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      return {
        items: result.value.items.map((p) => ({
          id: p.id,
          userId: p.user_id,
          title: p.title,
          content: p.content,
          status: p.status,
          viewCount: p.view_count,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          publishedAt: p.published_at ?? null
        })),
        page,
        pageSize,
        total: result.value.total
      }
    }
  )

  // POST /api/posts — create a draft post (authenticated)
  fastify.post<{ Body: CreatePost }>(
    '/',
    {
      schema: {
        body: CreatePostSchema,
        response: {
          201: PostResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { id: userId } = request.user
      const { title, content } = request.body

      const result = await postsRepository.create(userId, { title, content })

      if (result.isErr()) {
        log.error(`Failed to create post: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      const p = result.value
      reply.code(201)
      return {
        id: p.id,
        userId: p.user_id,
        title: p.title,
        content: p.content,
        status: p.status,
        viewCount: p.view_count,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        publishedAt: p.published_at ?? null
      }
    }
  )

  // GET /api/posts/:id — get a single post (public)
  fastify.get<{ Params: PostIdParams }>(
    '/:id',
    {
      schema: {
        params: PostIdParamsSchema,
        response: {
          200: PostResponseSchema,
          404: MessageResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { id } = request.params

      const result = await postsRepository.findById(id)

      if (result.isErr()) {
        log.error(`Failed to fetch post: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      if (!result.value) {
        return reply.notFound('Post not found')
      }

      const p = result.value
      return {
        id: p.id,
        userId: p.user_id,
        title: p.title,
        content: p.content,
        status: p.status,
        viewCount: p.view_count,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        publishedAt: p.published_at ?? null
      }
    }
  )

  // PATCH /api/posts/:id — update a post (authenticated, owner only)
  fastify.patch<{ Params: PostIdParams; Body: UpdatePost }>(
    '/:id',
    {
      schema: {
        params: PostIdParamsSchema,
        body: UpdatePostSchema,
        response: {
          200: MessageResponseSchema,
          404: MessageResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { id } = request.params
      const { id: userId } = request.user

      const post = await postsRepository.findById(id)
      if (post.isErr()) {
        log.error(`Failed to fetch post: ${post.error.message}`)
        return reply.internalServerError('Database error')
      }
      if (!post.value) return reply.notFound('Post not found')
      if (post.value.user_id !== userId) return reply.notFound('Post not found')

      const result = await postsRepository.update(id, userId, request.body)

      if (result.isErr()) {
        log.error(`Failed to update post: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      return { message: 'Post updated successfully' }
    }
  )

  // DELETE /api/posts/:id — soft-delete a post (authenticated, owner only)
  fastify.delete<{ Params: PostIdParams }>(
    '/:id',
    {
      schema: {
        params: PostIdParamsSchema,
        response: {
          200: MessageResponseSchema,
          404: MessageResponseSchema
        }
      }
    },
    async function (request, reply) {
      const { id } = request.params
      const { id: userId } = request.user

      const post = await postsRepository.findById(id)
      if (post.isErr()) {
        log.error(`Failed to fetch post: ${post.error.message}`)
        return reply.internalServerError('Database error')
      }
      if (!post.value) return reply.notFound('Post not found')
      if (post.value.user_id !== userId) return reply.notFound('Post not found')

      const result = await postsRepository.softDelete(id, userId)

      if (result.isErr()) {
        log.error(`Failed to delete post: ${result.error.message}`)
        return reply.internalServerError('Database error')
      }

      return { message: 'Post deleted successfully' }
    }
  )
}

export default plugin
