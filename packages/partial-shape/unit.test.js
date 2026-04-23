import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Shape, Implements } from '@kingjs/partial-shape'

class MyEmptyShape extends Shape { }
class MyGetterShape extends Shape { get value() { } }
class MySetterShape extends Shape { set value(value) { } }
class MyMethodShape extends Shape { method() { } }
class MyKitchenSinkShape extends Shape {
  [Implements] = [
    MyGetterShape,
    MySetterShape,
    MyMethodShape
  ]
}

class MyOtherGetterShape extends Shape { get otherValue() { } }
class MyOtherSetterShape extends Shape { set otherValue(value) { } }
class MyOtherMethodShape extends Shape { otherMethod() { } }

class MyType {
   constructor() {
    this.value$ = 42
    this.readOnly$ = false
  }
  get value() { return this.value$ }
  set value(value) { this.value$ = value }
  method() { return this.readOnly$ } 
}

class MyTaggedType extends MyType {
  static TypeTag = class { typeTagMethod() { } }
}

describe('An instance of a type', () => {
  let taggedInstance
  let instance
  beforeEach(() => {
    instance = new MyType()
    taggedInstance = new MyTaggedType()
  })

  it('should satisfy MyEmptyShape', () => {
    expect(instance).toBeInstanceOf(MyEmptyShape)
  })

  it('should satisfy MyGetterShape', () => {
    expect(instance).toBeInstanceOf(MyGetterShape)
  })
  it('should satisfy MySetterShape', () => {
    expect(instance).toBeInstanceOf(MySetterShape)
  })
  it('should satisfy MyMethodShape', () => {
    expect(instance).toBeInstanceOf(MyMethodShape)
  })
  it('should satisfy MyKitchenSinkShape', () => {
    expect(instance).toBeInstanceOf(MyKitchenSinkShape)
  })

  it('should not satisfy MyOtherGetterShape', () => {
    expect(instance).not.toBeInstanceOf(MyOtherGetterShape)
  })
  it('should not satisfy MyOtherSetterShape', () => {
    expect(instance).not.toBeInstanceOf(MyOtherSetterShape)
  })
  it('should not satisfy MyOtherMethodShape', () => {
    expect(instance).not.toBeInstanceOf(MyOtherMethodShape)
  })
})