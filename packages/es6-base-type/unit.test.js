import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { es6BaseType } from '@kingjs/es6-base-type'

describe('Es6BaseType', () => {
  let baseType
  it('reports Object as having no base type', () => {
    baseType = es6BaseType(Object)
    expect(baseType).toBeNull()
  })
  it('reports null as having no base type', () => {
    baseType = es6BaseType(null)
    expect(baseType).toBeNull()
  })
  it('reports Function as having Object as base type', () => {
    baseType = es6BaseType(Function)
    expect(baseType).toBe(Object)
  })
  it('reports a class with no extends as having Object as base type', () => {
    class MyClass { }
    baseType = es6BaseType(MyClass)
    expect(baseType).toBe(Object)
  })
  it('reports a class that extends null as having Object as a base type', () => {
    class MyClass extends null { }
    baseType = es6BaseType(MyClass)
    expect(baseType).toBe(Object)
  })
  it('reports a class that extends another class as having that class as base type', () => {
    class MyBaseClass { }
    class MyClass extends MyBaseClass { }
    baseType = es6BaseType(MyClass)
    expect(baseType).toBe(MyBaseClass)
  })
})