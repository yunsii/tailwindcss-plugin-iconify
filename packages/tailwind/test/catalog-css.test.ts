import { describe, expect, it, vi } from 'vitest'

import { catalogIcons } from '../src/plugin'

describe('testing catalog plugin options', () => {
  it('passes catalog icons to Tailwind matchComponents values', () => {
    const plugin = catalogIcons({
      version: 1,
      icons: {
        'mdi-light': ['home'],
      },
    })
    const matchComponents = vi.fn()

    plugin.handler({ matchComponents } as never)

    expect(matchComponents).toHaveBeenCalledWith(
      {
        icon: expect.any(Function),
      },
      {
        values: {
          'mdi-light--home': expect.objectContaining({
            '--svg': expect.any(String),
          }),
        },
      },
    )
    const [components] = matchComponents.mock.calls[0]!
    expect(components.icon('mdi-light--home')).toEqual(
      expect.objectContaining({
        '--svg': expect.stringContaining('data:image/svg+xml'),
      }),
    )
  })
})
