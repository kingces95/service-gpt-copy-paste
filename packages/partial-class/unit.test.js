import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialClass } from '@kingjs/partial-class'

describe('PartialClass', () => {
  it('cannot be instantiated', () => {
    expect(() => new PartialClass()).toThrow()
  })
})
