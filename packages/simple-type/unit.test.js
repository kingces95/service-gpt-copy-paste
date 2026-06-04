import { describe, expect, it } from 'vitest'
import { Metadata } from '@kingjs/metadata'
import {
  AnyBigInt,
  AnyBoolean,
  AnyFunction,
  AnyNonNullish,
  AnyNull,
  AnyNumber,
  AnyObject,
  AnyString,
  AnySymbol,
  AnyUndefined,
  AllOf,
  AnyOf,
  ConstructsOf,
  NormalNumber,
  OptionalOf,
} from '@kingjs/simple-type'

const AnyTests = [
  ['AnyUndefined', AnyUndefined, undefined, null],
  ['AnyNull', AnyNull, null, undefined],
  ['AnyBoolean', AnyBoolean, false, 'false'],
  ['AnyNumber', AnyNumber, 0, '0'],
  ['AnyBigInt', AnyBigInt, 0n, 0],
  ['AnyString', AnyString, '', 0],
  ['AnySymbol', AnySymbol, Symbol(), 'symbol'],
  ['AnyFunction', AnyFunction, function() { }, { }],
  ['AnyObject', AnyObject, { }, function() { }],
  ['AnyNonNullish', AnyNonNullish, function() { }, null],
]

class Pushable {
  static [Symbol.hasInstance](instance) {
    return typeof instance?.push == 'function'
  }
}

class Poppable {
  static [Symbol.hasInstance](instance) {
    return typeof instance?.pop == 'function'
  }
}

class Queue {
  push(value) { }
  pop() { }
}

class ReadOnlyQueue {
  pop() { }
}

describe.each(AnyTests)('%s', (_, Type, match, mismatch) => {
  it('matches expected values', () => {
    expect(match).toBeInstanceOf(Type)
  })

  it('rejects mismatches', () => {
    expect(mismatch).not.toBeInstanceOf(Type)
  })
})

describe('NormalNumber', () => {
  it('matches non-negative integers', () => {
    expect(0).toBeInstanceOf(NormalNumber)
    expect(1).toBeInstanceOf(NormalNumber)
    expect(-1).not.toBeInstanceOf(NormalNumber)
    expect(1.5).not.toBeInstanceOf(NormalNumber)
  })
})

describe('Optional', () => {
  it('matches undefined or the supplied simple type', () => {
    const OptionalNumber = OptionalOf(Number)

    expect(OptionalNumber.Type).toBe(AnyOf(AnyUndefined, Number))
    expect(undefined).toBeInstanceOf(OptionalNumber)
    expect(1).toBeInstanceOf(OptionalNumber)
    expect('1').not.toBeInstanceOf(OptionalNumber)
  })

  it('accepts algebra as its supplied simple type', () => {
    const OptionalStringOrNumber = OptionalOf(AnyOf(String, Number))

    expect(undefined).toBeInstanceOf(OptionalStringOrNumber)
    expect(1).toBeInstanceOf(OptionalStringOrNumber)
    expect('1').toBeInstanceOf(OptionalStringOrNumber)
    expect(true).not.toBeInstanceOf(OptionalStringOrNumber)
  })
})

describe('All', () => {
  it('matches values that satisfy every supplied simple type', () => {
    const OptionalNumberObject = AllOf(OptionalOf(Number), AnyNonNullish)

    expect(1).toBeInstanceOf(OptionalNumberObject)
    expect(undefined).not.toBeInstanceOf(OptionalNumberObject)
    expect('1').not.toBeInstanceOf(OptionalNumberObject)
  })
})

describe('Any', () => {
  it('matches values that satisfy any supplied simple type', () => {
    const StringOrNumber = AnyOf(String, Number)

    expect(1).toBeInstanceOf(StringOrNumber)
    expect('1').toBeInstanceOf(StringOrNumber)
    expect(true).not.toBeInstanceOf(StringOrNumber)
  })
})

describe('Constructs', () => {
  it('creates metadata types over constructor prototypes', () => {
    const PushPopContainer = ConstructsOf(AllOf(Pushable, Poppable))

    expect(PushPopContainer.name).toBe('Constructs')
    expect(PushPopContainer.Type).toBe(AllOf(Pushable, Poppable))
    expect(PushPopContainer.prototype).toBeInstanceOf(Metadata)
    expect(Queue).toBeInstanceOf(PushPopContainer)
    expect(ReadOnlyQueue).not.toBeInstanceOf(PushPopContainer)
    expect({ }).not.toBeInstanceOf(PushPopContainer)
  })
})

describe('primitive constructor matching', () => {
  it('maps primitive constructors to simple types', () => {
    expect(1).toBeInstanceOf(OptionalOf(Number))
    expect('1').not.toBeInstanceOf(OptionalOf(Number))
    expect(function() { }).toBeInstanceOf(OptionalOf(Object))
  })
})
