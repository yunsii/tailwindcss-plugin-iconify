# tailwindcss-plugin-iconify

Use any icon from Iconify (support local icons directly and figma icon sets), for TailwindCSS.

[![NPM version](https://img.shields.io/npm/v/tailwindcss-plugin-iconify?color=a1b858&label=)](https://www.npmjs.com/package/tailwindcss-plugin-iconify) [![Download monthly](https://img.shields.io/npm/dm/tailwindcss-plugin-iconify.svg)](https://www.npmjs.com/package/tailwindcss-plugin-iconify)

## Features

- `preprocessSets` - support autocomplete for [individual icon sets](https://iconify.design/docs/icons/json.html)
- [`local-icon-sets`](./src/extensions/local-icon-sets.ts) extension - easy to load local assets
  - Support import SVG icons directory by default
  - Support import [IconifyJSON](https://iconify.design/docs/types/iconify-json.html) path
- [`figma-icon-sets`](./src/extensions/figma-icon-sets/index.ts) extension - easy to load Figma icons

## About Figma icons

[TailwindCSS do not support async plugin for now](https://github.com/tailwindlabs/tailwindcss/discussions/7277), so `figma-icon-sets` extension you can not use directly.

But this library export related node scripts:

- `importFigmaIconSets` to import [IconSet](https://iconify.design/docs/libraries/tools/icon-set/#iconset-class)s from figma files
- `writeIconifyJSONs` to write corresponding JSON files and SVG icons preview HTMLs
- `loadFigmaIconSets` = `importFigmaIconSets` + `writeIconifyJSONs`

### Icon limitations

ref: [iconify.design/import/figma](https://iconify.design/docs/libraries/tools/import/figma/#limitations)

## Motivation

I want to use _tailwind autocomplete_ for **Iconify** icon sets and support _local icon sets_. related issue: [iconify/iconify#241](https://github.com/iconify/iconify/issues/241)

## Credits

- [@egoist/tailwindcss-icons](https://github.com/egoist/tailwindcss-icons)
- [@iconify/tailwind](https://github.com/iconify/iconify/tree/main/plugins/tailwind?rgh-link-date=2023-08-13T05%3A08%3A09Z)

## Build & Publish

- `npm run build`
- `npx changeset`
- `npx changeset version`
- `git commit`
- `npx changeset publish`
- `git push --follow-tags`

> [`changeset` prerelease doc](https://github.com/changesets/changesets/blob/main/docs/prereleases.md)

## License

[MIT](./LICENSE) License © 2022 [Yuns](https://github.com/yunsii)
