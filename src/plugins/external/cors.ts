import cors, { FastifyCorsOptions } from '@fastify/cors'

export const autoConfig: FastifyCorsOptions = {
  origin: (origin, cb) => {
    const allowList = ['http://localhost:3000', 'https://xxx.example.com']

    if (!origin || allowList.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'), false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}

/**
 * This plugins enables the use of CORS.
 *
 * @see {@link https://github.com/fastify/fastify-cors}
 */
export default cors
