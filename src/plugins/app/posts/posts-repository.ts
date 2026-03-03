import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { sql } from 'kysely'
import { ok } from 'neverthrow'

import { toResult } from '../../../utils/result.js'

declare module 'fastify' {
  interface FastifyInstance {
    postsRepository: ReturnType<typeof createPostsRepository>
  }
}

const POST_COLUMNS = [
  'id',
  'user_id',
  'title',
  'content',
  'status',
  'view_count',
  'created_at',
  'updated_at',
  'published_at'
] as const

export function createPostsRepository(fastify: FastifyInstance) {
  const db = fastify.kysely

  return {
    async findById(id: number) {
      return toResult(
        db
          .selectFrom('posts')
          .select(POST_COLUMNS)
          .where('id', '=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst()
          .then((post) => post ?? null)
      )
    },

    async findPublished(options: { page: number; pageSize: number }) {
      const { page, pageSize } = options
      const offset = (page - 1) * pageSize

      const [posts, countResult] = await Promise.all([
        toResult(
          db
            .selectFrom('posts')
            .select(POST_COLUMNS)
            .where('status', '=', 'published')
            .where('deleted_at', 'is', null)
            .orderBy('published_at', 'desc')
            .limit(pageSize)
            .offset(offset)
            .execute()
        ),
        toResult(
          db
            .selectFrom('posts')
            .select(db.fn.count<number>('id').as('count'))
            .where('status', '=', 'published')
            .where('deleted_at', 'is', null)
            .executeTakeFirstOrThrow()
            .then((r) => Number(r.count))
        )
      ])

      if (posts.isErr()) return posts
      if (countResult.isErr()) return countResult

      return ok({ items: posts.value, total: countResult.value })
    },

    async create(userId: number, data: { title: string; content: string }) {
      return toResult(
        db
          .insertInto('posts')
          .values({
            user_id: userId,
            title: data.title,
            content: data.content,
            created_at: sql<number>`unixepoch()`,
            updated_at: sql<number>`unixepoch()`
          })
          .returning(POST_COLUMNS)
          .executeTakeFirstOrThrow()
      )
    },

    async update(
      id: number,
      userId: number,
      data: { title?: string; content?: string; status?: string }
    ) {
      return toResult(
        db
          .updateTable('posts')
          .set({
            ...(data.title !== undefined && { title: data.title }),
            ...(data.content !== undefined && { content: data.content }),
            ...(data.status !== undefined && { status: data.status }),
            // Preserve first publication timestamp on subsequent publishes
            ...(data.status === 'published' && {
              published_at: sql<number>`COALESCE(published_at, unixepoch())`
            }),
            updated_at: sql<number>`unixepoch()`,
            version: sql<number>`version + 1`
          })
          .where('id', '=', id)
          .where('user_id', '=', userId)
          .where('deleted_at', 'is', null)
          .execute()
      )
    },

    async softDelete(id: number, userId: number) {
      return toResult(
        db
          .updateTable('posts')
          .set({
            deleted_at: sql<number>`unixepoch()`,
            updated_at: sql<number>`unixepoch()`,
            version: sql<number>`version + 1`
          })
          .where('id', '=', id)
          .where('user_id', '=', userId)
          .where('deleted_at', 'is', null)
          .execute()
      )
    }
  }
}

export default fp(
  async function (fastify: FastifyInstance) {
    fastify.decorate('postsRepository', createPostsRepository(fastify))
  },
  {
    name: 'posts-repository',
    dependencies: ['kysely']
  }
)
