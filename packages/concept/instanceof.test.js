import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Concept, Concepts } from '@kingjs/concept'

class MyEmptyConcept extends Concept { }
class MyGetterConcept extends Concept { get value() { } }
class MySetterConcept extends Concept { set value(value) { } }
class MyMethodConcept extends Concept { method() { } }
class MyKitchenSinkConcept extends Concept {
  [Concepts] = [
    MyGetterConcept,
    MySetterConcept,
    MyMethodConcept
  ]
}

class MyOtherGetterConcept extends Concept { get otherValue() { } }
class MyOtherSetterConcept extends Concept { set otherValue(value) { } }
class MyOtherMethodConcept extends Concept { otherMethod() { } }

class MyTagConcept extends Concept {
  typeTagMethod() { }
}
class MyTaggedConcept extends Concept {
  static TypeTag = MyTagConcept
}
class MyTaggedConceptWithFoo extends Concept {
  static TypeTag = MyTagConcept
  foo() { }
}
class MyTaggedConceptWithMethod extends Concept {
  static TypeTag = MyTagConcept
  method() { }
}
class MyInheritedTaggedConcept extends Concept {
  static [Concepts] = MyTaggedConcept
}

class MyType {
  static TypeTag = class { typeTagMethod() { } }

  constructor() {
    this.value$ = 42
    this.readOnly$ = false
  }
  get value() { return this.value$ }
  set value(value) { this.value$ = value }
  get method() { return this.readOnly$ }
}

describe('An instance of a type', () => {
  let instance
  beforeEach(() => {
    instance = new MyType()
  })

  it('should satisfy MyEmptyConcept', () => {
    expect(instance).toBeInstanceOf(MyEmptyConcept)
  })
  it('should satisfy MyTaggedConcept', () => {
    expect(instance).toBeInstanceOf(MyTaggedConcept)
  })
  it('should satisfy MyTaggedConceptWithMethod', () => {
    expect(instance).toBeInstanceOf(MyTaggedConceptWithMethod)
  })
  it('should satisfy MyInheritedTaggedConcept', () => {
    expect(instance).toBeInstanceOf(MyInheritedTaggedConcept)
  })
  it('should not satisfy MyTaggedConceptWithFoo', () => {
    expect(instance).not.toBeInstanceOf(MyTaggedConceptWithFoo)
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
  it('should satisfy MyKitchenSinkConcept', () => {
    expect(instance).toBeInstanceOf(MyKitchenSinkConcept)
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