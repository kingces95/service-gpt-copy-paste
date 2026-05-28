import { describe, it, expect } from 'vitest'
import {
  declareName,
  declareMethod,
  declareGetter,
  declareSetter,
  declareField,
  declareType,
} from '@kingjs/es6-define'

describe('es6 define', () => {
  it('declares a name', () => {
    class Type {
    }

    expect(declareName(Type, 'Other')).toBe(Type)
    expect(Object.getOwnPropertyDescriptor(Type, 'name')).toEqual({
      value: 'Other',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  })

  it('declares a method', () => {
    const target = { }
    function method() { }

    expect(declareMethod(target, 'method', method)).toBe(target)
    expect(Object.getOwnPropertyDescriptor(target, 'method')).toEqual({
      value: method,
      writable: true,
      enumerable: false,
      configurable: true,
    })
  })

  it('declares a getter', () => {
    const target = { }
    function get() { }

    expect(declareGetter(target, 'value', get)).toBe(target)
    expect(Object.getOwnPropertyDescriptor(target, 'value')).toEqual({
      get,
      set: undefined,
      enumerable: false,
      configurable: true,
    })
  })

  it('declares a setter', () => {
    const target = { }
    function set() { }

    expect(declareSetter(target, 'value', set)).toBe(target)
    expect(Object.getOwnPropertyDescriptor(target, 'value')).toEqual({
      get: undefined,
      set,
      enumerable: false,
      configurable: true,
    })
  })

  it('declares a field', () => {
    const target = { }

    expect(declareField(target, 'value', 42)).toBe(target)
    expect(Object.getOwnPropertyDescriptor(target, 'value')).toEqual({
      value: 42,
      writable: true,
      enumerable: true,
      configurable: true,
    })
  })

  it('declares a type', () => {
    class Base {
    }

    const Type = declareType('Type', Base, {
      method() { return 42 },
    })

    expect(Type.name).toBe('Type')
    expect(Type.prototype).toBeInstanceOf(Base)
    expect(new Type().method()).toBe(42)
  })
})
