import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  Descriptor,
  DataDescriptor,
  PropertyDescriptor,
  GetterDescriptor,
  SetterDescriptor
} from "@kingjs/descriptor"
import { value } from '@kingjs/abstract'

const Instance = { }
const SomeValue = { }
const SomeLambda = () => { }

const Tests = {
  MethodDescriptor: {
    type: 'data',
    descriptor: {
      value: function() { 
        // only called while testing callable shape
        expect(this).toBe(Instance)
        return SomeValue
      },
      enumerable: false,
      configurable: true,
      writable: true,
    },
    modifiers: [ 'configurable', 'writable' ],
    shapes: [ 'callable', 'readable', 'writable', 'mutable' ],
  },
  GetterDescriptor: {
    type: 'getter',
    descriptor: {
      get: function() { return SomeValue },
      enumerable: false,
      configurable: true,
    },
    modifiers: [ 'configurable' ],
    shapes: [ 'readable' ],
    value: SomeValue,
  },
  GetterOfMethodDescriptor: {
    type: 'getter',
    descriptor: {
      get: function() { return SomeLambda },
      enumerable: false,
      configurable: true,
    },
    modifiers: [ 'configurable' ],
    shapes: [ 'callable', 'readable' ],
    value: SomeLambda,
  },  
  SetterDescriptor: {
    type: 'setter',
    descriptor: {
      set: function(value) { },
      enumerable: false,
      configurable: true,
    },
    modifiers: [ 'configurable' ],
    shapes: [ 'writable' ],
  },
  OtherSetterDescriptor: {
    type: 'setter',
    descriptor: {
      set: function(value) { },
      enumerable: true,
      configurable: false,
    },
    modifiers: [ 'enumerable' ],
    shapes: [ 'writable' ],
  },
  PropertyDescriptor: {
    type: 'property',
    descriptor: {
      get: function() { return SomeValue },
      set: function(value) { },
      enumerable: false,
      configurable: true,
    },
    modifiers: [ 'configurable' ],
    shapes: [ 'readable', 'writable', 'mutable' ],
    value: SomeValue,
  },
  PropertyOfMethodDescriptor: {
    type: 'property',
    descriptor: {
      get: function() { return SomeLambda },
      set: function(value) { },
      enumerable: false,
      configurable: true,
    },
    modifiers: [ 'configurable' ],
    shapes: [ 'callable', 'readable', 'writable', 'mutable' ],
    value: SomeLambda,
  },
  NumberDescriptor: {
    type: 'data',
    descriptor: {
      value: 42,
      enumerable: true,
      configurable: true,
      writable: true,
    },
    modifiers: [ 'configurable', 'enumerable', 'writable' ],
    shapes: [ 'readable', 'writable', 'mutable' ],
    value: 42,
  },
  ConstDescriptor: {
    type: 'data',
    descriptor: {
      value: 42,
      enumerable: true,
      configurable: false,
      writable: false,
    },
    modifiers: [ 'enumerable' ],
    shapes: [ 'readable' ],
    value: 42,
  },
  GetterThatThrowsDescriptor: {
    type: 'getter',
    descriptor: {
      get: function() { throw new Error('bad getter') },
      enumerable: false,
      configurable: true,
    },
    modifiers: [ 'configurable' ],
    shapes: [ 'readable' ],
  },
}

describe('Descriptor', () => {
  it('returns false for null for tests', () => {
    expect(Descriptor.hasValue(null)).toBe(false)
    expect(Descriptor.hasGetter(null)).toBe(false)
    expect(Descriptor.hasSetter(null)).toBe(false)
    expect(Descriptor.hasAccessor(null)).toBe(false)
  })
  it('get finds toString given a class prototype', () => {
    const expected = Descriptor.get(Object.prototype, 'toString')
    class SomeClass { }
    const actual = Descriptor.get(SomeClass.prototype, 'toString')
    expect(actual.value).toBe(expected.value)
  })
  it('get does not find missing key', () => {
    class SomeClass { }
    const actual = Descriptor.get(SomeClass.prototype, 'missing')
    expect(actual).toBe(undefined)
  })

  it('compares descriptor slots without comparing value identity', () => {
    expect(Descriptor.equalSlots({
      value: function one() { },
      enumerable: false,
      configurable: true,
      writable: true,
    }, {
      value: function two() { },
      enumerable: false,
      configurable: true,
      writable: true,
    })).toBe(true)

    expect(Descriptor.equalSlots({
      value: function one() { },
      enumerable: false,
      configurable: true,
      writable: true,
    }, {
      value: function two() { },
      enumerable: false,
      configurable: true,
      writable: false,
    })).toBe(false)
  })

  it('recognizes an accessor half of a whole accessor', () => {
    const whole = {
      get() { },
      set(value) { },
      enumerable: false,
      configurable: true,
    }

    expect(Descriptor.isAccessorHalfOf({
      get() { },
      enumerable: false,
      configurable: true,
    }, whole)).toBe(true)

    expect(Descriptor.isAccessorHalfOf({
      set(value) { },
      enumerable: false,
      configurable: true,
    }, whole)).toBe(true)

    expect(Descriptor.isAccessorHalfOf({
      get() { },
      set(value) { },
      enumerable: false,
      configurable: true,
    }, whole)).toBe(false)
  })
})

describe.each(Object.entries(Tests))('%s', (_, test) => {
  const { descriptor, shapes, modifiers, type } = test
  it('should have correct type', () => {
    const actual = Descriptor.typeof(descriptor)
    const expected = type
    expect(actual).toBe(expected)
  })
  it('should have expected modifiers', () => {
    const actual = [...Descriptor.modifiers(descriptor)]
    const expected = modifiers
    expect(actual).toEqual(expected)
  })
  it('should have correct shapes', () => {
    const set = new Set(shapes)
    for (const shape of [ 'readable', 'writable', 'callable', 'mutable' ]) {
      const actual = Descriptor.formof(descriptor, { }, shape)
      const expected = set.has(shape)
      expect(actual).toBe(expected)
    }
  })
  if ('value' in test) {
    it('should have correct value', () => {
      const actual = Descriptor.getValue(descriptor, Instance).value
      const expected = test.value
      expect(actual).toBe(expected)
    })
  }
})

const MetadataTests = {
  DataDescriptor: {
    metadata: DataDescriptor,
    type: 'data',
    defaults: {
      configurable: true,
      enumerable: true,
      writable: true,
    }
  },
  PropertyDescriptor: {
    metadata: PropertyDescriptor,
    type: 'property',
    defaults: {
      configurable: true,
      enumerable: false,
    }
  },
  GetterDescriptor: {
    metadata: GetterDescriptor,
    type: 'getter',
    defaults: {
      configurable: true,
      enumerable: false,
    }
  },
  SetterDescriptor: {
    metadata: SetterDescriptor,
    type: 'setter',
    defaults: {
      configurable: true,
      enumerable: false,
    }
  },
}

describe.each(Object.entries(MetadataTests))('%s', (_, test) => {
  const { type, defaults } = test
  it('has correct type', () => {
    const actual = test.metadata.Type
    const expected = type
    expect(actual).toBe(expected)
  })
  it('has correct enumerable default', () => {
    const actual = test.metadata.DefaultEnumerable
    const expected = defaults.enumerable
    expect(actual).toBe(expected)
  })
  it('has correct configurable default', () => {
    const actual = test.metadata.DefaultConfigurable
    const expected = defaults.configurable
    expect(actual).toBe(expected)
  })
  if ('writable' in defaults) {
    it('has correct writable default', () => {
      const actual = test.metadata.DefaultWritable
      const expected = defaults.writable
      expect(actual).toBe(expected)
    })
  }
})
