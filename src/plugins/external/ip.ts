import { FastifyPluginAsync } from 'fastify'
import type { FastifyIPOptions } from 'fastify-ip'
import fastifyIp from 'fastify-ip'
import fp from 'fastify-plugin'

const plugin: FastifyPluginAsync<FastifyIPOptions> = async (fastify, opts) => {
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
