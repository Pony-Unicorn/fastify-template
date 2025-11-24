import { Static, Type } from '@sinclair/typebox'

import { EmailSchema } from './common.js'

// Password must contain at least: 1 uppercase, 1 lowercase, 1 digit, 1 special character
const passwordPattern =
  '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?]).{8,32}$'

const PasswordSchema = Type.String({
  pattern: passwordPattern,
  minLength: 8,
  maxLength: 32
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

export interface UpdateCredentials
  extends Static<typeof UpdateCredentialsSchema> {}

export const RegisterSchema = Type.Object({
  email: EmailSchema,
  username: Type.String({
    minLength: 2,
    maxLength: 50
  }),
  password: PasswordSchema,
  inviterCode: Type.Optional(Type.Number({ minimum: 1 }))
})

export interface Register extends Static<typeof RegisterSchema> {}

// User info querystring
export const UserInfoQuerySchema = Type.Object({
  email: EmailSchema
})

export interface UserInfoQuery extends Static<typeof UserInfoQuerySchema> {}
