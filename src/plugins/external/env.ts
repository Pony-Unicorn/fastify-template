import env from '@fastify/env'

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      NODE_ENV: string
      PORT: number
      DATABASE_URL: string
      RATE_LIMIT_MAX: number
      CORS_ORIGINS: string
      JWT_SECRET: string
      JWT_EXPIRES_IN: string
      COOKIE_NAME: string
    }
  }
}

const schema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET'],
  properties: {
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    PORT: {
      type: 'number',
      default: 3000
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
    },
    JWT_SECRET: {
      type: 'string'
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '7d'
    },
    COOKIE_NAME: {
      type: 'string',
      default: 'session_id'
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
 * @see {@link https://github.com/fastify/fastify-env}
 */
export default env
