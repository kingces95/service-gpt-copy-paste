import { describe, it, expect } from 'vitest'
import {
  genericMethod,
  genericType,
} from '@kingjs/generic'

class Type {
}

class OtherType {
}

class Requirement {
  static [Symbol.hasInstance](value) {
    return value === Type
  }
}

describe('genericMethod', () => {
  it('checks type arguments with contract', () => {
    const of = genericMethod([Requirement],
      type => function value() { return type })

    expect(of(Type)()).toBe(Type)
    expect(() => of(OtherType)).toThrow('Argument 0 must be Requirement.')
  })

  it('requires type arguments to be functions', () => {
    const of = genericMethod([null],
      type => function value() { return type })

    expect(() => of({ })).toThrow(
      'Generic arguments must be types.')
  })

  it('requires specializations to be functions', () => {
    const of = genericMethod([Function],
      type => ({ type }))

    expect(() => of(Type)).toThrow(
      'Generic method must return a function.')
  })

  it('accepts an unchecked definition', () => {
    const of = genericMethod(
      type => function value() { return type })

    expect(of(Type)()).toBe(Type)
  })

  it('does not cache method specializations', () => {
    const of = genericMethod([Function],
      type => function value() { return type })

    expect(of(Type)).not.toBe(of(Type))
  })

  it('caches type specializations', () => {
    const ValueOf = genericType([Function],
      type => class Value { static type = type })

    expect(ValueOf(Type)).toBe(ValueOf(Type))
    expect(ValueOf(Type)).not.toBe(ValueOf(OtherType))
  })

  it('accepts an unchecked type definition', () => {
    const ValueOf = genericType(
      type => class Value { static type = type })

    expect(ValueOf(Type)).toBe(ValueOf(Type))
    expect(ValueOf(Type).type).toBe(Type)
  })

  it('passes preconditions through to contract', () => {
    const of = genericMethod([Function], {
      precondition(type) {
        if (type != Type)
          throw new Error('expected Type')
      },
    },
    type => function value() { return type })

    expect(of(Type)()).toBe(Type)
    expect(() => of(OtherType)).toThrow('expected Type')
  })
})
