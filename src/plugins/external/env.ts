import env from '@fastify/env'

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      NODE_ENV: string
      DATABASE_URL: string
      RATE_LIMIT_MAX: number
      CORS_ORIGINS: string
    }
  }
}

const schema = {
  type: 'object',
  required: ['DATABASE_URL'],
  properties: {
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    DATABASE_URL: {
      type: 'string'
    },
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100
    },
    CORS_ORIGINS: {
      type: 'string',
      default: '' // Comma-separated list
    }
  }
}

export const autoConfig = {
  // Schema to validate
  schema,

  // Needed to read .env in root folder
  dotenv: true
  // or, pass config options available on dotenv module
  // dotenv: {
  //   path: `${import.meta.dirname}/.env`,
  //   debug: true
  // }
}

/**
 * Environment variables plugin for application runtime configuration.
 *
 * Only includes variables used in the application code.
 * Script-only variables (CAN_*) are accessed directly via process.env.
 * Fastify CLI variables (PORT, LOG_LEVEL, etc.) are handled automatically.
 *
 * @see {@link https://github.com/fastify/fastify-env}
 */
export default env
