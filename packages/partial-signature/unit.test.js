import { describe, expect, it } from 'vitest'
import { members, signature } from './index.js'
import {
  ArgChecks,
  Defaults,
  Preconditions,
  Signature,
} from '@kingjs/partial-symbols'

class FirstArg { }
class SecondArg { }

describe('@kingjs/partial-signature', () => {
  it('declares member metadata on the host type', () => {
    class Type { }
    function member(first, second) { return [first, second] }
    const defaults = [1]

    const result = signature(Type, {
      types: [FirstArg, SecondArg],
      defaults,
    }, member)

    expect(result).toBe(member)
    expect(Type[ArgChecks].member).toEqual([FirstArg, SecondArg])
    expect(Type[Defaults].member).toBe(defaults)
  })

  it('declares own metadata without mutating inherited metadata', () => {
    function member() { }

    class Base { }
    signature(Base, {
      types: [FirstArg],
    }, member)

    class Derived extends Base { }
    signature(Derived, {
      types: [SecondArg],
    }, member)

    expect(Base[ArgChecks].member).toEqual([FirstArg])
    expect(Derived[ArgChecks].member).toEqual([SecondArg])
  })

  it('lowers signature records to members', () => {
    class Type { }
    const defaults = [1]
    const precondition = () => { }

    const result = members(Type, {
      member: {
        types: [FirstArg, SecondArg],
        defaults,
        precondition,
        method(first, second) { return [first, second] },
      },
    })

    expect(result.member.name).toBe(Signature)
    expect(result.member(1, 2)).toEqual([1, 2])
    expect(Type[ArgChecks].member).toEqual([FirstArg, SecondArg])
    expect(Type[Defaults].member).toBe(defaults)
    expect(Type[Preconditions].member).toBe(precondition)
  })

  it('lowers signature records to accessor halves', () => {
    class Type { }

    const result = members(Type, {
      value: {
        types: [FirstArg],
        set(value) { this._value = value },
      },
    })

    const descriptor = Object.getOwnPropertyDescriptor(result, 'value')
    expect(descriptor.set.name).toBe('value')
    expect(descriptor.get).toBeUndefined()
    expect(Type[ArgChecks].value).toEqual([FirstArg])
  })

})
