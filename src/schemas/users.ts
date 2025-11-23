import { Type } from '@sinclair/typebox'

import { EmailSchema } from './common.js'

const passwordPattern = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,32}$'

const PasswordSchema = Type.String({
  pattern: passwordPattern,
  minLength: 8
})

// User info response (reusable)
export const UserInfoSchema = Type.Object({
  username: Type.String(),
  email: Type.String()
})

// Users list response with pagination
export const UsersListResponseSchema = Type.Object({
  items: Type.Array(UserInfoSchema),
  page: Type.Integer({ minimum: 1 }),
  pageSize: Type.Integer({ minimum: 1 }),
  total: Type.Integer({ minimum: 0 })
})

export const UpdateCredentialsSchema = Type.Object({
  email: EmailSchema,
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema
})

export const RegisterSchema = Type.Object({
  email: EmailSchema,
  username: Type.String({
    minLength: 2,
    maxLength: 50
  }),
  password: PasswordSchema,
  inviterCode: Type.Optional(Type.Number({ minimum: 1 }))
})
