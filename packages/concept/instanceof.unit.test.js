import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Concept } from '@kingjs/concept'

class MyGetterConcept extends Concept { get value() { } }
class MySetterConcept extends Concept { set value(value) { } }
class MyMethodConcept extends Concept { get isReadOnly() { } }

class MySuperGetterConcept extends MyGetterConcept { }
class MySuperSetterConcept extends MySetterConcept { }
class MySuperMethodConcept extends MyMethodConcept { }

class MyOtherGetterConcept extends MyGetterConcept { get otherValue() { } }
class MyOtherSetterConcept extends MySetterConcept { set otherValue(value) { } }
class MyOtherMethodConcept extends MyMethodConcept { get isOtherReadOnly() { } }

class MyType {

  constructor() {
    this.value$ = 42
    this.readOnly$ = false
  }
  get value() { return this.value$ }
  set value(value) { this.value$ = value }
  get isReadOnly() { return this.readOnly$ }
}

describe('An instance of a type', () => {
  let instance
  beforeEach(() => {
    instance = new MyType()
  })

  it('should satisfy Concept', () => {
    expect(instance).toBeInstanceOf(Concept)
  })

  it('should satisfy MyGetterConcept', () => {
    expect(instance).toBeInstanceOf(MyGetterConcept)
  })
  it('should satisfy MySetterConcept', () => {
    expect(instance).toBeInstanceOf(MySetterConcept)
  })
  it('should satisfy MyMethodConcept', () => {
    expect(instance).toBeInstanceOf(MyMethodConcept)
  })

  it('should satisfy MySuperGetterConcept', () => {
    expect(instance).toBeInstanceOf(MySuperGetterConcept)
  })
  it('should satisfy MySuperSetterConcept', () => {
    expect(instance).toBeInstanceOf(MySuperSetterConcept)
  })
  it('should satisfy MySuperMethodConcept', () => {
    expect(instance).toBeInstanceOf(MySuperMethodConcept)
  })

  it('should not satisfy MyOtherGetterConcept', () => {
    expect(instance).not.toBeInstanceOf(MyOtherGetterConcept)
  })
  it('should not satisfy MyOtherSetterConcept', () => {
    expect(instance).not.toBeInstanceOf(MyOtherSetterConcept)
  })
  it('should not satisfy MyOtherMethodConcept', () => {
    expect(instance).not.toBeInstanceOf(MyOtherMethodConcept)
  })
})