import { Type } from '@sinclair/typebox'

import { EmailSchema } from './common.js'

const passwordPattern = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,32}$'

const PasswordSchema = Type.String({
  pattern: passwordPattern,
  minLength: 8
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
