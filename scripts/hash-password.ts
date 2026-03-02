import { scryptHash } from '../src/plugins/app/password-manager.js'

const password = process.argv[2]

if (!password) {
  console.error('Usage: pnpm run util:hash -- <password>')
  process.exit(1)
}

const hash = await scryptHash(password)
console.log(hash)
