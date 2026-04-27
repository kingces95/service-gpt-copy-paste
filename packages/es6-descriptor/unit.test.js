import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Descriptors } from '@kingjs/es6-descriptor-sampler'
 
describe('Descriptor', () => {
  describe.each(Descriptors)('%s', (_, md) => {
    it('is correct info type', () => {
      const type = Es6Descriptor.typeof(md.descriptor)
      expect(type).toBe(md.type)
    })
    it('has correct modifiers', () => {
      const actual = [...Es6Descriptor.modifiers(md.descriptor)]
      const expected = md.modifiers
      expect(actual).toEqual(expected)
    })
    it('has correct shape', () => {
      const actual = Es6Descriptor.shapeof(md.descriptor)
      const expected = md.shape
      expect(actual).toBe(expected)
    })
    it('formof expected', () => {
      for (const shape of md.formof) {
        const formof = Es6Descriptor.formof(md.descriptor, shape)
        expect(formof).toBe(true)
      }
    })
    it('not formof unexpected', () => {
      const unexpectedShapes = [ 'readable', 'writable', 'callable', 'mutable' ]
        .filter(shape => !md.formof.includes(shape))
      for (const shape of unexpectedShapes) {
        const formof = Es6Descriptor.formof(md.descriptor, shape)
        expect(formof).toBe(false)
      }
    })
  })
})

const MethodDescriptor = {
  value() { return this.value },
  enumerable: false
}
const FieldDescriptor = {
  value: 42
}
const GetterDescriptor = {
  get() { return this.value }
}
const SetterDescriptor = {
  set(value) { this.value = value }
}
const PropertyDescriptor = {
  get() { return this.value },
  set() { }
}

const TestValue = [
  ['method', MethodDescriptor],
  ['field', FieldDescriptor],
  ['getter', GetterDescriptor],
  ['property', PropertyDescriptor],
]

describe.each(TestValue)('A %s descriptor', (type, descriptor) => {
  it('has correct value', () => {
    const instance = { value: 42 }
    const { value: actual } = Es6Descriptor.getValue(descriptor, instance)
    const expected = 42
    expect(actual).toBe(expected)
  })
})
