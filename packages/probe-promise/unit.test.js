import { describe, expect, it } from 'vitest'
import {
  PromiseProbe,
  ThenableProbe,
} from '@kingjs/probe-promise'

describe('PromiseProbe', () => {
  it('accepts promises', () => {
    expect(Promise.resolve()).toBeInstanceOf(PromiseProbe)
  })

  it('accepts custom promise-like values', () => {
    const value = new (class {
      then() { }
      catch() { }
      finally() { }
    })()

    expect(value).toBeInstanceOf(PromiseProbe)
  })

  it('rejects bare thenables', () => {
    expect({ then() { } }).not.toBeInstanceOf(PromiseProbe)
  })
})

describe('ThenableProbe', () => {
  it('accepts promises and thenables', () => {
    expect(Promise.resolve()).toBeInstanceOf(ThenableProbe)
    expect({ then() { } }).toBeInstanceOf(ThenableProbe)
  })

  it('rejects non thenables', () => {
    expect({ }).not.toBeInstanceOf(ThenableProbe)
  })
})
