import { getConfigForTs } from 'eslint-config-wdzeng'

export default getConfigForTs(
  {},
  {
    projectRoot: import.meta.dirname,
    ignores: ['**/*.mjs'],
    ecmaVersion: 2023,
    node: true,
    browser: false,
    vitest: true
  }
)
