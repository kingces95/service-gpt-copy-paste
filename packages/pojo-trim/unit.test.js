import { describe, expect, it } from 'vitest'
import { trimPojo } from '@kingjs/pojo-trim'

describe('trimPojo', () => {
  it('should compact arrays by default', () => {
    expect(trimPojo([undefined, 'x'])).toEqual(['x'])
  })

  it('should preserve positional arrays when sparseArray is true', () => {
    const actual = trimPojo({
      defaults: [undefined, 'x', { a: undefined, b: 'y' }],
      conditions: { },
    }, {
      sparseArray: true,
    })

    expect(actual.defaults).toHaveLength(3)
    expect(actual.defaults[0]).toBeUndefined()
    expect(actual.defaults[1]).toBe('x')
    expect(actual.defaults[2]).toEqual({ b: 'y' })
  })
})
