import { Static, Type } from '@sinclair/typebox'

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

export const DefaultResponseJsonSchema = Type.Object({
  statusCode: Type.Number(),
  message: Type.String()
})

// 响应体
export const ResponseJsonSchema = Type.Object({
  statusCode: Type.Number({
    default: 200,
    description: '状态码, 正常为 200 和 http 状态码统一'
  }),
  message: Type.String({ default: 'OK', description: '消息' }),
  result: Type.Unknown()
})

export type ResponseJson = Static<typeof ResponseJsonSchema>

// 响应分页信息
export const PagingInfoSchema = Type.Object({
  page: Type.Integer({ minimum: 1, description: '当前页码' }),
  pageSize: Type.Integer({ minimum: 1, description: '每页数量' }),
  total: Type.Integer({ minimum: 0, description: '总数量' })
})

// 分页查询
export const PagingQueryStringSchema = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1, description: '当前页码' }),
  pageSize: Type.Integer({ minimum: 1, default: 20, description: '每页数量' })
})

// 请求头
export const HeaderAuthSchema = Type.Object({
  Authorization: Type.String()
})
