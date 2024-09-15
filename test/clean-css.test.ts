import { describe, expect, it } from 'vitest'

import { getCSSRulesForIcons } from '../src/clean'

describe('testing clean CSS rules', () => {
  it('one icon', () => {
    const data = getCSSRulesForIcons('mdi-light:home')
    expect(Object.keys(data)).toEqual([
      '.icon--mdi-light',
      '.icon--mdi-light--home',
    ])
    expect(Object.keys(data['.icon--mdi-light--home'])).toEqual(['--svg'])
  })

  it('multiple icons from same icon set', () => {
    const data = getCSSRulesForIcons([
      // By name
      'mdi-light:home',
      // By selector
      '.icon--mdi-light--arrow-left',
      '.icon--mdi-light.icon--mdi-light--arrow-down',
      // By class name
      'icon--mdi-light--file',
      'icon--mdi-light icon--mdi-light--format-clear',
    ])
    expect(Object.keys(data)).toEqual([
      '.icon--mdi-light',
      '.icon--mdi-light--home',
      '.icon--mdi-light--arrow-left',
      '.icon--mdi-light--arrow-down',
      '.icon--mdi-light--file',
      '.icon--mdi-light--format-clear',
    ])
  })

  it('multiple icon sets', () => {
    const data = getCSSRulesForIcons([
      // MDI Light
      'mdi-light:home',
      // Line MD
      'line-md:home',
    ])
    expect(Object.keys(data)).toEqual([
      '.icon--mdi-light',
      '.icon--mdi-light--home',
      '.icon--line-md',
      '.icon--line-md--home',
    ])
  })

  it('bad class name', () => {
    let threw = false
    try {
      getCSSRulesForIcons(['icon--mdi-light--home test'])
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })

  it('bad icon set', () => {
    let threw = false
    try {
      getCSSRulesForIcons('test123:home')
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })
})
