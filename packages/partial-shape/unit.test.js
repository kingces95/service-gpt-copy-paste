import { describe, it, expect } from 'vitest'
import { abstract } from '@kingjs/abstract'
import {
  Adjacent,
  Compile,
  Includes,
  Transparent,
  Implements,
} from '@kingjs/partial-symbols'
import { Concept } from '@kingjs/partial-concept'
import { Shape } from '@kingjs/partial-shape'

class MyShape extends Shape {
  method() { }
}

describe('Shape', () => {
  it('is transparent', () => {
    expect(Shape[Transparent]).toBe(true)
  })

  it('declares its adjacent metadata', () => {
    expect(Shape[Adjacent]).toEqual({
      [Implements]: Concept,
      [Includes]: Shape,
    })
  })

  it('compiles descriptors to abstract descriptors', () => {
    const actual = Shape[Compile]({ value: () => { } })

    expect(actual).toEqual({
      value: abstract,
      writable: true,
      enumerable: false,
      configurable: true,
    })
  })

  it('does not match Shape itself', () => {
    expect(Shape[Symbol.hasInstance](Shape)).toBe(false)
  })

  it('does not match null', () => {
    expect(null).not.toBeInstanceOf(MyShape)
  })

  it('does not match an object with no constructor type', () => {
    const instance = Object.create(null)

    expect(instance).not.toBeInstanceOf(MyShape)
  })

  it('does not match a structurally incompatible instance', () => {
    expect({ }).not.toBeInstanceOf(MyShape)
  })

  it('matches a structurally compatible instance', () => {
    class MyType {
      method() { }
    }

    expect(new MyType()).toBeInstanceOf(MyShape)
  })

  it('uses cached positive matches', () => {
    class MyType {
      method() { }
    }

    expect(new MyType()).toBeInstanceOf(MyShape)
    expect(new MyType()).toBeInstanceOf(MyShape)
  })

  it('uses cached negative matches', () => {
    class MyType { }

    expect(new MyType()).not.toBeInstanceOf(MyShape)
    expect(new MyType()).not.toBeInstanceOf(MyShape)
  })
})
