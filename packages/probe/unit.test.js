import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Probe } from '@kingjs/probe'

class MyEmptyProbe extends Probe { }
class MyGetterProbe extends Probe { get value() { } }
class MySetterProbe extends Probe { set value(value) { } }
class MyMethodProbe extends Probe { method() { } }
class MyKitchenSinkProbe extends Probe {
  get value() { }
  set value(value) { }
  method() { }
}

class MyOtherGetterProbe extends Probe { get otherValue() { } }
class MyOtherSetterProbe extends Probe { set otherValue(value) { } }
class MyOtherMethodProbe extends Probe { otherMethod() { } }

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

  it('should satisfy MyEmptyProbe', () => {
    expect(instance).toBeInstanceOf(MyEmptyProbe)
  })

  it('should satisfy MyGetterProbe', () => {
    expect(instance).toBeInstanceOf(MyGetterProbe)
  })
  it('should satisfy MySetterProbe', () => {
    expect(instance).toBeInstanceOf(MySetterProbe)
  })
  it('should satisfy MyMethodProbe', () => {
    expect(instance).toBeInstanceOf(MyMethodProbe)
  })
  it('should satisfy MyKitchenSinkProbe', () => {
    expect(instance).toBeInstanceOf(MyKitchenSinkProbe)
  })

  it('should not satisfy MyOtherGetterProbe', () => {
    expect(instance).not.toBeInstanceOf(MyOtherGetterProbe)
  })
  it('should not satisfy MyOtherSetterProbe', () => {
    expect(instance).not.toBeInstanceOf(MyOtherSetterProbe)
  })
  it('should not satisfy MyOtherMethodProbe', () => {
    expect(instance).not.toBeInstanceOf(MyOtherMethodProbe)
  })
})
