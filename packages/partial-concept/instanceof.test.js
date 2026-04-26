import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Concept, Implements } from '@kingjs/partial-concept'
import { implement } from '@kingjs/partial-implement'

class MyEmptyConcept extends Concept { }
class MyGetterConcept extends Concept { get value() { } }
class MySetterConcept extends Concept { set value(value) { } }
class MyMethodConcept extends Concept { method() { } }
class MyKitchenSinkConcept extends Concept {
  [Implements] = [
    MyGetterConcept,
    MySetterConcept,
    MyMethodConcept
  ]
}
class MyTagConcept extends Concept {
  typeTagMethod() { }
}
class MyTaggedConcept extends Concept {
  static TypeTag = MyTagConcept
}
class MyTaggedConceptWithMethod extends Concept {
  static TypeTag = MyTagConcept
  method() { }
}
class MyInheritedTaggedConcept extends Concept {
  static [Implements] = MyTaggedConcept
}

function MyTaggedTypeFn() {
  return class MyTaggedType extends MyTypeFn() {
    static TypeTag = class {
      static { implement(this, MyTagConcept) }
      typeTagMethod() { } 
    }
  }
}

function MyTypeFn() {
  return class MyType {
    constructor() {
      this.value$ = 42
      this.readOnly$ = false
    }
    get value() { return this.value$ }
    set value(value) { this.value$ = value }
    method() { return this.readOnly$ } 
  }
}

const Tests = {
  MyEmptyConcept: {
    type: MyTypeFn(),
    concept: MyEmptyConcept,
  },
  MyTaggedConcept: {
    type: MyTaggedTypeFn(),
    concept: MyTaggedConcept,
  },
  MyTaggedConceptWithMethod: {
    type: MyTaggedTypeFn(),
    concept: MyTaggedConceptWithMethod,
  },
  MyInheritedTaggedConcept: {
    type: MyTaggedTypeFn(),
    concept: MyInheritedTaggedConcept,
  },
  MyGetterConcept: {
    type: MyTypeFn(),
    concept: MyGetterConcept,
  },
  MySetterConcept: {
    type: MyTypeFn(),
    concept: MySetterConcept,
  },
  MyMethodConcept: {
    type: MyTypeFn(),
    concept: MyMethodConcept,
  },
  MyKitchenSinkConcept: {
    type: MyTypeFn(),
    concept: MyKitchenSinkConcept,
  },
}

describe.each(Object.entries(Tests))(
  '%s', (_, { type, concept }) => {
  let instance
  beforeEach(() => {
    instance = new type()
    implement(type, concept)
  })

  it('should satisfy the concept', () => {
    expect(instance).toBeInstanceOf(concept)
  })
})
