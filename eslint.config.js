import stylistic from '@stylistic/eslint-plugin'
import neo from 'neostandard'

export default [
  ...neo({
    ts: true
  }),
  {
    plugins: {
      '@stylistic': stylistic
    }
  }
]
