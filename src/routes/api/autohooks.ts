import { FastifyInstance } from 'fastify'

const PUBLIC_ROUTES = [
  'GET /api/',
  'GET /api/health',
  'POST /api/auth/login',
  'POST /api/auth/logout',
  'POST /api/users'
]

export default async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    const routeKey = `${request.method} ${request.url.split('?')[0]}`

    if (PUBLIC_ROUTES.includes(routeKey)) {
      return
    }

    await fastify.authenticate(request, reply)
  })
}
