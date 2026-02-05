import fastifyFavicon from 'fastify-favicon'
import fp from 'fastify-plugin'

/**
 * This plugin handles favicon requests, returning a default favicon
 * or a custom one if provided in the project root.
 *
 * Options:
 * - path: Directory location for the favicon file (defaults to project root)
 * - name: Filename of the favicon (defaults to 'favicon.ico')
 * - maxAge: Cache duration in seconds (defaults to 86400)
 *
 * @see {@link https://github.com/smartiniOnGitHub/fastify-favicon}
 */
export default fp(fastifyFavicon, {
  name: 'fastify-favicon'
})
