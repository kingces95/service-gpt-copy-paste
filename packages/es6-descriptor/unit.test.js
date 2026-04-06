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

const MethodDescriptorValue = {
  value() { return this.value },
  enumerable: false
}
const FieldDescriptorValue = {
  value: 42
}
const GetterDescriptorValue = {
  get() { return this.value }
}
const PropertyDescriptorValue = {
  get() { return this.value },
  set() { }
}

const TestValue = [
  ['method', MethodDescriptorValue],
  ['field', FieldDescriptorValue],
  ['getter', GetterDescriptorValue],
  ['property', PropertyDescriptorValue],
]

describe.each(TestValue)('A %s descriptor', (_, descriptor) => {
  it('has correct value', () => {
    const instance = { value: 42 }
    const actual = Es6Descriptor.getValue(descriptor, instance)
    const expected = 42
    expect(actual).toBe(expected)
  })
  it('has correct value when filtered', () => {
    const symbolKey = Symbol('key')
    const instance = { value: 42 }
    const actual = [...Es6Descriptor.values([symbolKey, descriptor], instance, { 
      descriptorFilter: Es6Descriptor.typeof(descriptor),
      valueFilter: value => value == 42,
    })]
    const expected = [{ key: symbolKey, value: 42 }]
    expect(actual).toEqual(expected)
  })
  it('can be filtered out by value', () => {
    const instance = { value: 42 }
    const actual = [...Es6Descriptor.values(['key', descriptor], instance, { 
      descriptorFilter: Es6Descriptor.typeof(descriptor),
      valueFilter: value => value == 43,
    })]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('can be filtered out by type', () => {
    const instance = { value: 42 }
    const actual = [...Es6Descriptor.values(['key', descriptor], instance, { 
      descriptorFilter: Es6Descriptor.typeof(descriptor) 
        == 'getter' ? 'data' : 'getter',
    })]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('will transmit function in descriptor stream', () => {
    const fn = () => { }
    const symbolKey = Symbol('key')
    const instance = { value: 42 }
    const actual = [...Es6Descriptor.values([
      fn, symbolKey, descriptor], instance, { 
        descriptorFilter: Es6Descriptor.typeof(descriptor),
        valueFilter: value => value == 42,
      })]
    const expected = [{ key: symbolKey, value: 42, host: fn }]
    expect(actual).toEqual(expected)
  })
})