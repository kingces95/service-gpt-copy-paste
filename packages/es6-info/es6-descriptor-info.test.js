import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  Es6DescriptorInfo,
} from './es6-descriptor-info'
import { Descriptors } from '@kingjs/es6-descriptor-sampler'

describe('DescriptorInfo', () => {
  describe.each(Descriptors)('%s', (_, md) => {
    let info
    beforeEach(() => {
      info = Es6DescriptorInfo.create(md.descriptor)
    })

    it('is correct info type', () => {
      expect(info instanceof md.infoType).toBe(true)
    })
    it('has a descriptor', () => {
      expect(info.descriptor).toBe(md.descriptor)
    })
    it('has correct predicates', () => {
      expect(info.type).toBe(md.type)

      expect(info.isGetter).toBe(md.type == 'getter')
      expect(info.isSetter).toBe(md.type == 'setter')
      expect(info.isProperty).toBe(md.type == 'property')
      expect(info.isAccessor).toBe(
        md.type == 'getter' 
        || md.type == 'setter' 
        || md.type == 'property')

      const d = md.descriptor
      expect(info.isConfigurable).toBe(d.configurable == true)
      expect(info.isEnumerable).toBe(d.enumerable == true)
      expect(info.isWritable).toBe(d.writable == true)
    })
    it('toString is correct', () => {
      expect(info.toString()).toBe(md.toString)
    })
    it('has correct modifiers', () => {
      const actual = Array.from(info.modifiers())
      const expected = md.modifiers
      expect(actual).toEqual(expected)
    })
    it('has correct getter', () => {
      expect(info.getter).toBe(md.descriptor.get)
    })
    it('has correct setter', () => {
      expect(info.setter).toBe(md.descriptor.set)
    })
    it('has correct fieldType', () => {
      expect(info.fieldType == md.fieldType).toBe(true)
    })
  })
})

