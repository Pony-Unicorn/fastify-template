import { Static, Type } from '@sinclair/typebox'

import { EmailSchema, StringSchema } from './common.js'

export const CredentialsSchema = Type.Object({
  email: EmailSchema,
  password: StringSchema
})

export type Credentials = Static<typeof CredentialsSchema>

export const JwtPayloadSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  email: EmailSchema
})

export type JwtPayload = Static<typeof JwtPayloadSchema>
