import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Descriptors } from '@kingjs/es6-descriptor-sampler'
 
describe('Descriptor', () => {
  describe.each(Descriptors)('%s', (_, md) => {
    it('does not equal the other descriptors', () => {
      for (const [_, otherMd] of Descriptors) {
        if (otherMd === md) continue
        const lhs = md.descriptor
        const rhs = otherMd.descriptor
        const areEqual = Es6Descriptor.equals(lhs, rhs)
        expect(areEqual).toBe(false)
      }
    })
    it('equals itself', () => {
      const areEqual = Es6Descriptor.equals(md.descriptor, md.descriptor)
      expect(areEqual).toBe(true)
    })
    it('is correct info type', () => {
      const type = Es6Descriptor.typeof(md.descriptor)
      expect(type).toBe(md.type)
    })
    it('has correct modifiers', () => {
      const actual = [...Es6Descriptor.modifiers(md.descriptor)]
      const expected = md.modifiers
      expect(actual).toEqual(expected)
    })
  })
})

