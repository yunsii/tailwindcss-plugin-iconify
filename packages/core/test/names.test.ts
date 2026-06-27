import { describe, expect, it } from 'vitest'

import {
  getIconNames,
  iconNameMapToCatalogIcons,
  mergeCatalogIcons,
  parseIconName,
} from '../src'

describe('icon names', () => {
  it('parses supported static forms', () => {
    expect(parseIconName('mdi-light:home')).toEqual({
      prefix: 'mdi-light',
      name: 'home',
    })
    expect(parseIconName('.icon--mdi-light--arrow-left')).toEqual({
      prefix: 'mdi-light',
      name: 'arrow-left',
    })
    expect(parseIconName('icon-[line-md--loading-loop]')).toEqual({
      prefix: 'line-md',
      name: 'loading-loop',
    })
  })

  it('builds catalog icons from mixed input', () => {
    expect(
      iconNameMapToCatalogIcons(
        getIconNames([
          'mdi-light:home',
          '.icon--mdi-light--arrow-left',
          'icon--line-md--home',
        ]),
      ),
    ).toEqual({
      'line-md': ['home'],
      'mdi-light': ['arrow-left', 'home'],
    })
  })

  it('merges and sorts catalog icons', () => {
    expect(
      mergeCatalogIcons(
        { mdi: ['z', 'a'] },
        { 'mdi': ['a', 'b'], 'line-md': ['home'] },
      ),
    ).toEqual({
      'line-md': ['home'],
      'mdi': ['a', 'b', 'z'],
    })
  })
})
