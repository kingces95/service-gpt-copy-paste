import { describe, it, expect } from 'vitest'
import { Metadata } from '@kingjs/metadata'

describe('Metadata', () => {
  it('should not be instantiated', () => {
    expect(() => new Metadata()).toThrow(
      'Metadata cannot be instantiated.')
  })
})
