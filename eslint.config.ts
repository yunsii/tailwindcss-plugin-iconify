import janna from '@jannajs/lint/eslint'

export default janna({
  ignores: [
    '**/.iconcat/**',
    '**/.next/**',
    '**/dist/**',
    '**/public/iconcat/**',
    '**/public/iconcat.css',
    '**/*.timestamp-*.mjs',
  ],
})
