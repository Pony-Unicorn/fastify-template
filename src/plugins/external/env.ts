import env from '@fastify/env'

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      NODE_ENV: string
      PORT: number
      DATABASE_URL: string
      FASTIFY_LOG_LEVEL: string
      FASTIFY_TRUST_PROXY_ENABLED: boolean
      RATE_LIMIT_MAX: number
      FASTIFY_CLOSE_GRACE_DELAY: number
      CAN_CREATE_DATABASE: boolean
      CAN_SEED_DATABASE: boolean
      CORS_ORIGINS: string
    }
  }
}

const schema = {
  type: 'object',
  required: ['DATABASE_URL'],
  properties: {
    // Environment
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    PORT: {
      type: 'number',
      default: 3000
    },

    // Database
    DATABASE_URL: {
      type: 'string'
    },
    CAN_CREATE_DATABASE: {
      type: 'boolean',
      default: false
    },
    CAN_SEED_DATABASE: {
      type: 'boolean',
      default: false
    },

    // fastify cli
    FASTIFY_CLOSE_GRACE_DELAY: {
      type: 'number',
      default: 1000
    },
    FASTIFY_LOG_LEVEL: {
      type: 'string',
      default: 'info'
    },
    FASTIFY_TRUST_PROXY_ENABLED: {
      type: 'boolean',
      default: false
    },

    // Security
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100 // Put it to 4 in your .env file for tests
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
 * This plugins helps to check environment variables.
 *
 * @see {@link https://github.com/fastify/fastify-env}
 */
export default env
