import { describe, it, expect } from 'vitest'
import {
  contract,
  defaultTo,
  overload,
  thunk,
} from '@kingjs/function-contract'
import { Tuple } from '@kingjs/tuple'

class Positive {
  static [Symbol.hasInstance](value) {
    return value > 0
  }
}

class LessThanTen {
  static [Symbol.hasInstance](value) {
    return value < 10
  }
}

class Thing { }

class StringValue {
  static [Symbol.hasInstance](value) {
    return typeof value == 'string'
  }
}

describe('contract', () => {
  it('should thunk defaults before transforms', () => {
    function identity(value) { return value }
    const normalize = thunk({
      defaults: [
        'thing',
      ],
      transforms: [
        function(value) { return this[value] },
      ],
    },
    identity)
    const context = { thing: new Thing() }

    expect(normalize.call(context)).toBe(context.thing)
  })

  it('should run instanceof checks', () => {
    function increment(value) { return value + 1 }
    const checkedIncrement = contract([[Positive]], increment)

    expect(checkedIncrement(1)).toBe(2)
    expect(() => checkedIncrement(0)).toThrow(
      'Argument 0 must be Positive.')
  })

  it('should run arrays of checks', () => {
    function identity(value) { return value }
    const checkedIdentity = contract([[
      Positive,
      LessThanTen,
    ]], identity)

    expect(checkedIdentity(1)).toBe(1)
    expect(() => checkedIdentity(0)).toThrow(
      'Argument 0 must be Positive.')
    expect(() => checkedIdentity(10)).toThrow(
      'Argument 0 must be LessThanTen.')
  })

  it('should wrap unwrapped slot checks', () => {
    function add(left, right) { return left + right }
    const checkedAdd = contract([Positive, LessThanTen], add)

    expect(checkedAdd(1, 2)).toBe(3)
    expect(() => checkedAdd(0, 2)).toThrow(
      'Argument 0 must be Positive.')
    expect(() => checkedAdd(1, 10)).toThrow(
      'Argument 1 must be LessThanTen.')
  })

  it('should treat ordinary types as instanceof checks', () => {
    function identity(value) { return value }
    const checkedIdentity = contract([[Thing]], identity)
    const thing = new Thing()

    expect(checkedIdentity(thing)).toBe(thing)
    expect(() => checkedIdentity({ })).toThrow(
      'Argument 0 must be Thing.')
  })

  it('should return a checked thunk when no function is provided', () => {
    const check = contract([[Positive]])

    expect(() => check(1)).not.toThrow()
    expect(() => check(0)).toThrow(
      'Argument 0 must be Positive.')
  })

  it('should apply defaults before checks', () => {
    function add(left, right = 1) { return left + right }
    const checkedAdd = contract([
      Positive,
      Positive,
    ], [ undefined, 1 ],
    add)

    expect(checkedAdd(1)).toBe(2)
    expect(() => checkedAdd(1, 0)).toThrow(
      'Argument 1 must be Positive.')
  })

  it('should use tuple names in errors', () => {
    const check = contract([Positive], Tuple.of('this'))

    expect(() => check(0)).toThrow(
      'Argument this must be Positive.')
  })

  it('should accept tuple names before metadata', () => {
    function add(left, right = 1) { return left + right }
    const checkedAdd = contract([
      Positive,
      Positive,
    ], Tuple.of('left', 'right'), [
      undefined,
      1,
    ],
    add)

    expect(checkedAdd(1)).toBe(2)
    expect(() => checkedAdd(1, 0)).toThrow(
      'Argument right must be Positive.')
  })

  it('should apply procedural defaults left to right', () => {
    function add(left, right) { return left + right }
    const checkedAdd = contract([
      Positive,
      Positive,
    ], [
      defaultTo(() => 1),
      defaultTo(({ args: [left] }) => left + 1),
    ],
    add)

    expect(checkedAdd()).toBe(3)
  })

  it('should pass this to procedural defaults', () => {
    function identity(value) { return value }
    const checkedIdentity = contract([
      Thing,
    ], [
      defaultTo(({ self }) => self.thing),
    ],
    identity)
    const context = { thing: new Thing() }

    expect(checkedIdentity.call(context)).toBe(context.thing)
  })

  it('should preserve literal function defaults', () => {
    function identity(value) { return value }
    const defaultFn = () => 1
    const checkedIdentity = contract([
      null,
    ], [
      defaultFn,
    ],
    identity)

    expect(checkedIdentity()).toBe(defaultFn)
  })

  it('should accept defaults in metadata', () => {
    function identity(value) { return value }
    const checkedIdentity = contract([
      Thing,
    ], {
      defaults: [
        defaultTo(({ self }) => self.thing),
      ],
    },
    identity)
    const context = { thing: new Thing() }

    expect(checkedIdentity.call(context)).toBe(context.thing)
  })

  it('should compose contract checks before thunk transforms', () => {
    function identity(value) { return value }
    const Defaults = [
      'thing',
    ]
    const checkedIdentity = contract([
      StringValue,
    ], {
      defaults: Defaults,
    },
    thunk({
      defaults: Defaults,
      transforms: [
        function(value) { return this[value] },
      ],
    },
    identity))
    const context = { thing: new Thing() }

    expect(checkedIdentity.call(context)).toBe(context.thing)
  })

  it('should use thunk for metadata without requirements', () => {
    function identity(value) { return value }
    const checkedIdentity = thunk({
      transforms: [
        value => value + 1,
      ],
    },
    identity)

    expect(checkedIdentity(1)).toBe(2)
  })

  it('should dispatch to the first matching overload', () => {
    class Even {
      static [Symbol.hasInstance](value) {
        return value % 2 == 0
      }
    }

    function parity(value) { return 'odd' }

    const checkedParity = overload([
      Positive,
    ], [
      {
        when: [ Even ],
        use: function even() { return 'even' },
      },
    ],
    parity)

    expect(checkedParity(1)).toBe('odd')
    expect(checkedParity(2)).toBe('even')
  })

  it('should dispatch only when where matches', () => {
    class NumberLike {
      static [Symbol.hasInstance](value) {
        return typeof value == 'number'
      }
    }

    function compare(left, right) { return 'different' }

    const checkedCompare = overload([
      NumberLike,
      NumberLike,
    ], [
      {
        when: [ NumberLike, NumberLike ],
        where(left, right) { return left == right },
        use: function same() { return 'same' },
      },
    ],
    compare)

    expect(checkedCompare(1, 1)).toBe('same')
    expect(checkedCompare(1, 2)).toBe('different')
  })
})
