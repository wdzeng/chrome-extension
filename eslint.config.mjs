import { getConfigForTs } from 'eslint-config-wdzeng'

export default getConfigForTs(
  {
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-top-level-await': 'off', // transpiled cjs does not support top-level await
  },
  {
    projectRoot: import.meta.dirname,
    ignores: ['**/*.mjs', "dist/**"],
    ecmaVersion: 2022,
    node: true,
    browser: false,
    vitest: false
  }
)
