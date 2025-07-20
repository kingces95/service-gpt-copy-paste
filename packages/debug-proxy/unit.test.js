import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { DebugProxy, Preconditions } from '@kingjs/debug-proxy'
import { GlobalPrecondition } from '@kingjs/proxy'

class MyProxy extends DebugProxy {
  static [Preconditions] = class extends DebugProxy[Preconditions] {
    get valueA() { throw new Error('valueA from myProxy') }
    get valueB() { throw new Error('valueB from myProxy') }
  }

  constructor() { super() }
  get valueA() { }
  get valueB() { }
}

describe('MyProxy', () => {
  let instance
  beforeEach(() => {
    instance = new MyProxy()
  })
  it('should throw accsessing valueA', () => {
    expect(() => { instance.valueA }).toThrow('valueA from myProxy')
  })
  it('should throw accessing valueB', () => {
    expect(() => { instance.valueB }).toThrow('valueB from myProxy')
  })
})

class MyExtension extends MyProxy {
  static [Preconditions] = class extends MyProxy[Preconditions] {
    get valueB() { throw new Error('valueB from myExtension') }
    get valueC() { throw new Error('valueC from myExtension') }
  }

  constructor() { super() }
  get valueC() { }
}

describe('MyExtension', () => {
  let instance
  beforeEach(() => {
    instance = new MyExtension()
  })
  it('should throw accessing valueA', () => {
    expect(() => { instance.valueA }).toThrow('valueA from myProxy')
  })
  it('should throw accessing valueB', () => {
    expect(() => { instance.valueB }).toThrow('valueB from myExtension')
  })
  it('should throw accessing valueC', () => {
    expect(() => { instance.valueC }).toThrow('valueC from myExtension')
  })
})

class MyDebugProxy extends DebugProxy {
  #value
  constructor() {
    super()
    // Gotcha: if an extended class declares a global precondition that
    // attempts to access a private member of the extended class (as would
    // happen testing for isDisposed etc.) then that access will fail since
    // the extended class' constructor has not yet run (apparently).
    // this.value = 42

    // Workaround: only access private members in constructors or non-public
    // members (those not ending with $ or starting with _).
    this.__value = 42
    this.#value = 42
  }
}
class MyPrivateMembers extends MyDebugProxy {
  static [Preconditions] = class extends DebugProxy[Preconditions] {
    [GlobalPrecondition]() {
      // skip precondition while instance is being activated
      if (!this.alive$) throw new Error(
        'not alive from myPrivateMembers')
    }
  }

  #alive
  constructor() {
    super()
    this.#alive = true
  }
  get alive$() { return this.#alive }
  set alive$(value) { this.#alive = value }
  get alive() { return this.alive$ }
}

describe('MyPrivateMembers class', () => {
  it('should activate', () => {
    const instance = new MyPrivateMembers()
    expect(instance.alive).toBe(true)
  })
})