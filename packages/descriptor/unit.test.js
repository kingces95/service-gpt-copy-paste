import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  Descriptor,
  DataDescriptor,
  PropertyDescriptor,
  GetterDescriptor,
  SetterDescriptor
} from "@kingjs/descriptor"

const TestMethodDescriptor = {
  name: 'Method',
  type: 'data',
  descriptor: {
    value: function() { },
    enumerable: false,
    configurable: true,
    writable: true,
  },
  modifiers: [ 'configurable', 'writable' ]
}

const TestGetterDescriptor = {
  name: 'Getter',
  type: 'getter',
  descriptor: {
    get: function() { },
    enumerable: false,
    configurable: true,
  },
  modifiers: [ 'configurable' ]
}

const TestSetterDescriptor = {
  name: 'Setter',
  type: 'setter',
  descriptor: {
    set: function(value) { },
    enumerable: false,
    configurable: true,
  },
  modifiers: [ 'configurable' ]
}

const TestPropertyDescriptor = {
  name: 'Property',
  type: 'property',
  descriptor: {
    get: function() { },
    set: function(value) { },
    enumerable: false,
    configurable: true,
  },
  modifiers: [ 'configurable' ]
}

const TestNumberDescriptor = {
  name: 'Data',
  type: 'data',
  descriptor: {
    value: 42,
    enumerable: true,
    configurable: true,
    writable: true,
  },
  modifiers: [ 'configurable', 'enumerable', 'writable' ]
}

const Descriptors = [
  [TestMethodDescriptor.name, TestMethodDescriptor],
  [TestGetterDescriptor.name, TestGetterDescriptor],
  [TestSetterDescriptor.name, TestSetterDescriptor],
  [TestPropertyDescriptor.name, TestPropertyDescriptor],
  [TestNumberDescriptor.name, TestNumberDescriptor],
]

describe('Descriptor', () => {
  it('returns false for null for tests', () => {
    expect(null instanceof Descriptor).toBe(false)
    expect(Descriptor.hasValue(null)).toBe(false)
    expect(Descriptor.hasGetter(null)).toBe(false)
    expect(Descriptor.hasSetter(null)).toBe(false)
    expect(Descriptor.hasAccessor(null)).toBe(false)
  })

  describe.each(Descriptors)('%s', (_, test) => {
    const { descriptor } = test
    it('should have correct type', () => {
      const actual = Descriptor.typeof(descriptor)
      const expected = test.type
      expect(actual).toBe(expected)
    })
    it('should have expected modifiers', () => {
      const actual = [...Descriptor.modifiers(descriptor)]
      const expected = test.modifiers
      expect(actual).toEqual(expected)
    })
  })
})

describe('DataDescriptor', () => {
  it('has Type "data"', () => {
    expect(DataDescriptor.Type).toBe('data')
  })
  it('has correct defaults', () => {
    expect(DataDescriptor.DefaultConfigurable).toBe(true)
    expect(DataDescriptor.DefaultWritable).toBe(true)
    expect(DataDescriptor.DefaultEnumerable).toBe(true)
  })
})

describe('PropertyDescriptor', () => {
  it('has Type "property"', () => {
    expect(PropertyDescriptor.Type).toBe('property')
  })
  it('has correct defaults', () => {
    expect(PropertyDescriptor.DefaultConfigurable).toBe(true)
    expect(PropertyDescriptor.DefaultEnumerable).toBe(false)
  })
})

describe('GetterDescriptor', () => {
  it('has Type "getter"', () => {
    expect(GetterDescriptor.Type).toBe('getter')
  })
  it('has correct defaults', () => {
    expect(GetterDescriptor.DefaultConfigurable).toBe(true)
    expect(GetterDescriptor.DefaultEnumerable).toBe(false)
  })
})

describe('SetterDescriptor', () => {
  it('has Type "setter"', () => {
    expect(SetterDescriptor.Type).toBe('setter')
  })
  it('has correct defaults', () => {
    expect(SetterDescriptor.DefaultConfigurable).toBe(true)
    expect(SetterDescriptor.DefaultEnumerable).toBe(false)
  })
})
