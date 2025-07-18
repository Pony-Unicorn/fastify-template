import { Static, Type } from '@sinclair/typebox'

import { EmailSchema, StringSchema } from './common.js'

export const CredentialsSchema = Type.Object({
  email: EmailSchema,
  password: StringSchema
})

export interface Credentials extends Static<typeof CredentialsSchema> {}
