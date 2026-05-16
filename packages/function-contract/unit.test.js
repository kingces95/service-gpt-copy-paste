import { describe, it, expect } from 'vitest'
import { contract } from '@kingjs/function-contract'

class Positive {
  static [Symbol.hasInstance](value) {
    if (value > 0) return true
    throw new RangeError('Value must be positive.')
  }
}

class LessThanTen {
  static [Symbol.hasInstance](value) {
    if (value < 10) return true
    throw new RangeError('Value must be less than ten.')
  }
}

class Thing { }

describe('contract', () => {
  it('should run instanceof checks', () => {
    function increment(value) { return value + 1 }
    const checkedIncrement = contract([[Positive]], increment)

    expect(checkedIncrement(1)).toBe(2)
    expect(() => checkedIncrement(0)).toThrow(
      'Value must be positive.')
  })

  it('should run arrays of checks', () => {
    function identity(value) { return value }
    const checkedIdentity = contract([[
      Positive,
      LessThanTen,
    ]], identity)

    expect(checkedIdentity(1)).toBe(1)
    expect(() => checkedIdentity(0)).toThrow(
      'Value must be positive.')
    expect(() => checkedIdentity(10)).toThrow(
      'Value must be less than ten.')
  })

  it('should treat ordinary types as instanceof checks', () => {
    function identity(value) { return value }
    const checkedIdentity = contract([[Thing]], identity)
    const thing = new Thing()

    expect(checkedIdentity(thing)).toBe(thing)
    expect(() => checkedIdentity({ })).toThrow(
      'Argument must be an instance of Thing.')
  })

  it('should return a checked thunk when no function is provided', () => {
    const check = contract([[Positive]])

    expect(() => check(1)).not.toThrow()
    expect(() => check(0)).toThrow(
      'Value must be positive.')
  })
})
