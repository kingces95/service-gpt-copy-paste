import { describe, it, expect } from 'vitest'
import { Preconditions, PartialProxy } from '@kingjs/partial-proxy'
import { extend } from '@kingjs/partial-extend'
import { PartialClass } from '@kingjs/partial-class'

class MyPartial extends PartialClass {
  static [Preconditions] = {
    myMethod() { this.push('MyPartial:myMethod:precondition') },
  }

  myMethod() { this.push('MyPartial:myMethod') }
}

class MyExtendedPartial extends PartialClass {
  static {
    extend(this, MyPartial)
  }
}

class MyType extends PartialProxy {
  constructor() {
    super()
    this._calls = []
  }

  static {
    extend(this, MyExtendedPartial)
  }

  push(value) { this._calls.push(value) }
  get calls() { return this._calls }
}

describe('nested partial thunks', () => {
  it('wraps a method once when copied through another partial', () => {
    const instance = new MyType()

    instance.myMethod()

    // MyExtendedPartial composes MyPartial structurally because PartialClass
    // does not define CreateThunk. The runtime thunk is installed only when
    // the composed member is copied onto MyType, which extends PartialProxy.
    expect(instance.calls).toEqual([
      'MyPartial:myMethod:precondition',
      'MyPartial:myMethod',
    ])
  })
})
