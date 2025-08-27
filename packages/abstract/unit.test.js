import { describe, it, expect, beforeEach } from 'vitest'
import { 
  isAbstract,
  abstract,
} from "@kingjs/abstract"

describe('abstract', () => {
  it('throws an error', () => {
    expect(() => abstract()).toThrowError('Abstract member not implemented')
  })
})

describe('A descriptor', () => {
  let descriptor
  beforeEach(() => {
    descriptor = { }
  })

  it('should not be abstract for null', () => {
    expect(isAbstract(null)).toBe(false)
  })
  describe('with a non-abstract member', () => {
    beforeEach(() => {
      descriptor.value = () => { }
    })
    it('should not be abstract', () => {
      expect(isAbstract(descriptor)).toBe(false)
    })
  })
  describe('with an abstract getter', () => {
    beforeEach(() => {
      descriptor.get = abstract
    })
    it('should be abstract', () => {
      expect(isAbstract(descriptor)).toBe(true)
    })
  })
  describe('with an abstract setter', () => {
    beforeEach(() => {
      descriptor.set = abstract
    })
    it('should be abstract', () => {
      expect(isAbstract(descriptor)).toBe(true)
    })
  })
  describe('with an abstract value', () => {
    beforeEach(() => {
      descriptor.value = abstract
    })
    it('should be abstract', () => {
      expect(isAbstract(descriptor)).toBe(true)
    })
  })
})
