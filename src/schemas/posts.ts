import { Static, Type } from '@sinclair/typebox'

import { IdSchema, StringSchema } from './common.js'

export const PostIdParamsSchema = Type.Object({ id: IdSchema })

export const PostStatusSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('published'),
  Type.Literal('archived')
])

export const CreatePostSchema = Type.Object({
  title: StringSchema,
  content: Type.String({ minLength: 1, maxLength: 10000 })
})

export const UpdatePostSchema = Type.Object({
  title: Type.Optional(StringSchema),
  content: Type.Optional(Type.String({ minLength: 1, maxLength: 10000 })),
  status: Type.Optional(PostStatusSchema)
})

export const PostResponseSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  userId: Type.Integer({ minimum: 1 }),
  title: Type.String(),
  content: Type.String(),
  status: PostStatusSchema,
  viewCount: Type.Integer({ minimum: 0 }),
  createdAt: Type.Integer(),
  updatedAt: Type.Integer(),
  publishedAt: Type.Union([Type.Integer(), Type.Null()])
})

export const PostsListResponseSchema = Type.Object({
  items: Type.Array(PostResponseSchema),
  page: Type.Integer({ minimum: 1 }),
  pageSize: Type.Integer({ minimum: 1 }),
  total: Type.Integer({ minimum: 0 })
})

export type PostIdParams = Static<typeof PostIdParamsSchema>
export type CreatePost = Static<typeof CreatePostSchema>
export type UpdatePost = Static<typeof UpdatePostSchema>
