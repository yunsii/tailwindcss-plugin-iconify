import janna from '@jannajs/lint/eslint'

export default janna({
  ignores: [
    '**/.iconcat/**',
    '**/.next/**',
    '**/dist/**',
    '**/next-env.d.ts',
    '**/public/iconcat/**',
    '**/public/iconcat.css',
    '**/*.timestamp-*.mjs',
  ],
})
