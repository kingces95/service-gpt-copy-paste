import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Concept, implement } from '@kingjs/concept'
import { DebugProxy, Preconditions } from "@kingjs/debug-proxy"

class MyPreconditionsConcept extends Concept {
  static [Preconditions] = class extends Concept {
    get valueAWithPrecondition() { throw new Error(
      'value from myPreconditionsConcept') }
  }

  get valueAWithPrecondition() { }
}
class MyExtendedPreconditionsConcept extends MyPreconditionsConcept {
  static [Preconditions] = class extends MyPreconditionsConcept[Preconditions] {
    get valueBWithPrecondition() { throw new Error(
      'value from myExtendedPreconditionsConcept') }
  }

  get valueBWithPrecondition() { }
}

class MyType extends DebugProxy {
  static [Preconditions] = class {
    static {
      implement(this, MyExtendedPreconditionsConcept[Preconditions])
    }
  }

  static {
    implement(this, Concept)
    implement(this, MyExtendedPreconditionsConcept)
  }

  constructor() {
    super()
  }
  get valueBWithPrecondition() { }
}

describe('An instance of a type', () => {
  let instance
  beforeEach(() => {
    instance = new MyType()
  })

  it('should satisfy MyPreconditionsConcept', () => {
    expect(instance).toBeInstanceOf(MyPreconditionsConcept)
  })
  it('should satisfy MyExtendedPreconditionsConcept', () => {
    expect(instance).toBeInstanceOf(MyExtendedPreconditionsConcept)
  })
  it('should throw accessing valueAWithPrecondition', () => {
    expect(() => { instance.valueAWithPrecondition }).toThrow(
      'value from myPreconditionsConcept'
    )
  })
  it('should throw accessing valueBWithPrecondition', () => {
    expect(() => { instance.valueBWithPrecondition }).toThrow(
      'value from myExtendedPreconditionsConcept'
    )
  })
})