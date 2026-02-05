import fastifyIp from 'fastify-ip'
import type { FastifyIPOptions } from 'fastify-ip'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const plugin: FastifyPluginAsync<FastifyIPOptions> = async (fastify, opts) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await fastify.register(fastifyIp as any, opts)
}

/**
 * This plugin provides correct IP address detection behind proxies.
 * It checks common proxy headers (x-forwarded-for, cf-connecting-ip, x-real-ip, etc.)
 * and decorates `request.ip` with the client's real IP address.
 *
 * @see {@link https://github.com/metcoder95/fastify-ip}
 */
export default fp(plugin, {
  name: 'fastify-ip'
})
