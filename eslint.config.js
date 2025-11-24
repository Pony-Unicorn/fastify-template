import prettier from 'eslint-config-prettier'
import neo from 'neostandard'

export default [
  ...neo({
    ts: true
  }),
  prettier
]
