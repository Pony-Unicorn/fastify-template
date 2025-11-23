import { Type } from '@sinclair/typebox'

export const StringSchema = Type.String({
  minLength: 1,
  maxLength: 255
})

export const EmailSchema = Type.String({
  format: 'email',
  minLength: 1,
  maxLength: 255
})

export const DateTimeSchema = Type.String({ format: 'date-time' })

export const IdSchema = Type.Integer({ minimum: 1 })

// Common message response
export const MessageResponseSchema = Type.Object({
  message: Type.String()
})

// Pagination info (JSON response uses camelCase)
export const PagingInfoSchema = Type.Object({
  page: Type.Integer({ minimum: 1, description: 'Current page number' }),
  pageSize: Type.Integer({ minimum: 1, description: 'Items per page' }),
  total: Type.Integer({ minimum: 0, description: 'Total count' })
})

// Pagination query (URL parameters use snake_case per RESTful conventions)
export const PagingQueryStringSchema = Type.Object({
  page: Type.Integer({
    minimum: 1,
    default: 1,
    description: 'Current page number'
  }),
  page_size: Type.Integer({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Items per page'
  })
})

// Authorization header
export const HeaderAuthSchema = Type.Object({
  Authorization: Type.String()
})
