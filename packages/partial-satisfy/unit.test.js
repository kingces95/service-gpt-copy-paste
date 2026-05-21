import { describe, it, expect } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Shape, Includes } from '@kingjs/partial-shape'
import { satisfy } from '@kingjs/partial-satisfy'

class MyShape extends Shape {
  method() { }
}

describe('satisfy', () => {
  it('rejects a non-type target', () => {
    expect(() => satisfy(new class { }(), MyShape)).toThrow(
      'Type must be a function')
  })

  it('rejects a non-shape', () => {
    class MyType { }

    expect(() => satisfy(MyType, class { })).toThrow(
      'Argument shape must extend Shape.')
  })

  it('copies abstract shape descriptors', () => {
    class MyType { }

    satisfy(MyType, MyShape)
    expect(MyType.prototype.method).toBe(abstract)
  })

  it('copies implementation descriptors', () => {
    class MyType { }

    satisfy(MyType, MyShape, {
      method() { return 42 },
    })

    expect(new MyType().method()).toBe(42)
  })

  it('rejects implementation members not declared by the shape', () => {
    class MyType { }

    expect(() => satisfy(MyType, MyShape, {
      other() { },
    })).toThrow(`Shape 'MyShape' does not define member 'other'.`)
  })

  it('copies included shape descriptors', () => {
    class BaseShape extends Shape {
      base() { }
    }

    class DerivedShape extends Shape {
      static [Includes] = BaseShape

      derived() { }
    }

    class MyType { }

    satisfy(MyType, DerivedShape)
    expect(MyType.prototype.base).toBe(abstract)
    expect(MyType.prototype.derived).toBe(abstract)
  })

  it('does not publish shape as nominal composition', () => {
    class MyType { }

    satisfy(MyType, MyShape)
    expect([...PartialReflect.baseTypes(MyType)]).not.toContain(MyShape)
  })
})
