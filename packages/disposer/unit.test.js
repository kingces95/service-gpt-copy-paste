import { describe, it, expect } from 'vitest'
import { Disposer } from './index.js'

describe('Disposer', () => {
  
  it('implements dispose using an injected async function', () => {
    const fn = () => Promise.resolve('foo')
    const disposer = new Disposer(fn)
    expect(disposer).toBeInstanceOf(Disposer)
    expect(disposer.dispose).toBeInstanceOf(Function)
    return expect(disposer.dispose()).resolves.toBe('foo')
  })
})

