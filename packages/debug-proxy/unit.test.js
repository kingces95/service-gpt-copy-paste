import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { DebugProxy, Preconditions } from '@kingjs/debug-proxy'

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
