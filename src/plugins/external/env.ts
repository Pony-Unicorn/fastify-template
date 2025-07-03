import env from '@fastify/env'

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      PORT: number
      DATABASE_URL: string
      LOG_LEVEL: string
      RATE_LIMIT_MAX: number
    }
  }
}

const schema = {
  type: 'object',
  required: ['DATABASE_URL'],
  properties: {
    // Database
    DATABASE_URL: {
      type: 'string'
    },

    // Security
    LOG_LEVEL: {
      type: 'string',
      default: 'info'
    },
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100 // Put it to 4 in your .env file for tests
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
