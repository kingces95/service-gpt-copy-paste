import { describe, it, expect } from 'vitest'
import { Functor } from './index.js'

describe('functor', () => {
  class MyFunctor extends Functor {
    #name = 'myName'
    #args = []
    constructor() {
      super()
      this.#args.push(...arguments)
    }

    get args() { return this.#args }
    get name() { return this.#name}
    
    $() {
      this.#args.push(...arguments)
      return this
    }
  }

  it('constructor', () => {
    const functor = new MyFunctor('foo')
    expect(functor.args).toEqual(['foo'])
  })

  it('instanceof', () => {
    const functor = new MyFunctor()
    expect(functor).toBeInstanceOf(MyFunctor)
    expect(functor).toBeInstanceOf(Functor)
  })

  it('name', () => {
    const functor = new MyFunctor()
    expect(functor.name).toBe('myName')

    const { 
      enumerable,
      configurable,
    } = Object.getOwnPropertyDescriptor(functor, 'name')
    expect(enumerable).toBe(false)
    expect(configurable).toBe(true)
  })

  it('call', () => {
    const functor = new MyFunctor()
    const next = functor('foo')
    expect(next).toBe(functor)
    expect(functor.args).toEqual(['foo'])
  })
})

