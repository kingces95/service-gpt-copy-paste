import { describe, it, expect } from 'vitest'
import {
  ArrayMap,
  Deque,
  Float64Vector,
  ForwardList,
  List,
  Uint8Vector,
  UnorderedMap,
  UnorderedSet,
  Vector,
} from '@kingjs/cursor-container-standard'

describe('standard cursor containers', () => {
  it('exports concrete aliases', () => {
    for (const Type of [
      ArrayMap,
      Deque,
      Float64Vector,
      ForwardList,
      List,
      Uint8Vector,
      UnorderedMap,
      UnorderedSet,
      Vector,
    ])
      expect(typeof Type).toBe('function')
  })

  it('uses Float64Vector as the default Vector alias', () => {
    expect(Vector).toBe(Float64Vector)
    expect(Vector.spanType).toBe(Float64Array)
  })

  it('exports Uint8Vector as a named byte vector alias', () => {
    expect(Uint8Vector.spanType).toBe(Uint8Array)
  })
})
