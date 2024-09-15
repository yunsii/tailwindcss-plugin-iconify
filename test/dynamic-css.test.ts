import { describe, expect, it } from 'vitest'

import { getDynamicCSSRules } from '../src/dynamic'

describe('testing dynamic CSS rules', () => {
  it('one icon', () => {
    const data = getDynamicCSSRules('mdi-light--home')
    expect(typeof data['--svg']).toBe('string')
    expect(data).toEqual({
      'display': 'inline-block',
      'width': '1em',
      'height': '1em',
      'background-color': 'currentColor',
      '-webkit-mask-image': 'var(--svg)',
      'mask-image': 'var(--svg)',
      '-webkit-mask-repeat': 'no-repeat',
      'mask-repeat': 'no-repeat',
      '-webkit-mask-size': '100% 100%',
      'mask-size': '100% 100%',
      '--svg': data['--svg'],
    })
  })

  it('only selectors that override icon', () => {
    const data = getDynamicCSSRules('mdi-light--home', {
      overrideOnly: true,
    })
    expect(typeof data['--svg']).toBe('string')
    expect(data).toEqual({
      '--svg': data['--svg'],
    })
  })

  it('missing icon', () => {
    let threw = false
    try {
      getDynamicCSSRules('mdi-light--missing-icon-name')
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })

  it('bad icon name', () => {
    let threw = false
    try {
      getDynamicCSSRules('mdi-home')
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })

  it('bad icon set', () => {
    let threw = false
    try {
      getDynamicCSSRules('test123:home')
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
  })
})
