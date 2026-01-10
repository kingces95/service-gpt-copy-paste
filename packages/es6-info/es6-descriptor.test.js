import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  Es6Descriptor,
  Es6MethodDescriptor,
  Es6FieldDescriptor,
  Es6GetterDescriptor,
  Es6SetterDescriptor,
  Es6PropertyDescriptor,
} from './es6-descriptor.js'
import { 
  Es6DescriptorInfo,
  Es6MethodDescriptorInfo,
  Es6FieldDescriptorInfo,
  Es6GetterDescriptorInfo,
  Es6SetterDescriptorInfo,
  Es6PropertyDescriptorInfo,
} from './es6-descriptor-info'
import { abstract } from '@kingjs/abstract'

const Getter = {
  name: 'getter',
  descriptor: { 
    get: function myGetter() {},
    enumerable: Es6GetterDescriptor.DefaultEnumerable,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptorInfo,
  type: 'getter',
  modifiers: [  ],
  toString: 'getter',
}

const EnumerableGetter = {
  name: 'enumerable getter',
  descriptor: { 
    get: function myEnumerableGetter() {},
    enumerable: true,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptorInfo,
  type: 'getter',
  modifiers: [ 'enumerable' ],
  toString: 'enumerable getter',
}

const OtherGetter = {
  ...Getter,
  name: 'other getter',
  descriptor: { 
    get: function otherGetter() {},
    enumerable: Es6GetterDescriptor.DefaultEnumerable,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
}

const Setter = {
  name: 'setter',
  descriptor: {
    set: function mySetter(v) {},
    enumerable: Es6SetterDescriptor.DefaultEnumerable,
    configurable: Es6SetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6SetterDescriptorInfo,
  type: 'setter',
  modifiers: [  ],
  toString: 'setter',
}

const OtherSetter = {
  ...Setter,
  name: 'other setter',
  descriptor: {
    set: function otherSetter(v) {},
    enumerable: Es6SetterDescriptor.DefaultEnumerable,
    configurable: Es6SetterDescriptor.DefaultConfigurable,
  },
}

const Property = {
  name: 'property',
  descriptor: {
    get: function myPropertyGetter() {},
    set: function myPropertySetter(v) {},
    enumerable: Es6PropertyDescriptor.DefaultEnumerable,
    configurable: Es6PropertyDescriptor.DefaultConfigurable,
  },
  infoType: Es6PropertyDescriptorInfo,
  type: 'property',
  modifiers: [ ],
  toString: 'property',
}

const Method = {
  name: 'method',
  descriptor: {
    value: function myMethod() {},
    enumerable: false,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  modifiers: [  ],
  toString: 'method',
}

const Function = {
  name: 'visible method',
  descriptor: {
    value: function myVisibleMethod() {},
    enumerable: true,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'function',
  modifiers: [  ],
  toString: 'field [function]',
}

const ConstMethod = {
  name: 'const method',
  descriptor: {
    value: function myConstMethod() {},
    enumerable: false,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: false,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  modifiers: [ 'const' ],
  toString: 'const method',
}

const SealedMethod = {
  name: 'sealed method',
  descriptor: {
    value: function mySealedMethod() {},
    enumerable: false,
    configurable: false,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  modifiers: [ 'sealed' ],
  toString: 'sealed method',
}

const AbstractMethod = {
  name: 'abstract method',
  descriptor: {
    value: abstract,
    enumerable: false,
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  isAbstract: true,
  modifiers: [  ],
  toString: 'abstract method',
}

const Number = {
  name: 'number',
  descriptor: {
    value: 42,
    enumerable: true,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [  ],
  toString: 'field [number]',
}

const HiddenNumber = {
  name: 'hidden number',
  descriptor: {
    value: 42,
    enumerable: false,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [ 'hidden' ],
  toString: 'hidden field [number]',
}

const ConstNumber = {
  name: 'const number',
  descriptor: {
    value: 42,
    enumerable: true,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: false,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [ 'const' ],
  toString: 'const field [number]',
}

const NanNumber = {
  name: 'NaN number',
  descriptor: {
    value: NaN,
    enumerable: true,
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  fieldType: 'number',
  modifiers: [  ],
  toString: 'field [number]',
}

const Descriptors = [
  [ Getter.name, Getter ],
  [ EnumerableGetter.name, EnumerableGetter ],
  [ OtherGetter.name, OtherGetter ],
  [ Setter.name, Setter ],
  [ OtherSetter.name, OtherSetter ],
  [ Property.name, Property ],
  [ Method.name, Method ],
  [ Function.name, Function ],
  [ ConstMethod.name, ConstMethod ],
  [ SealedMethod.name, SealedMethod ],
  [ AbstractMethod.name, AbstractMethod ],
  [ Number.name, Number ],
  [ HiddenNumber.name, HiddenNumber ],
  [ ConstNumber.name, ConstNumber ],
  [ NanNumber.name, NanNumber ],
]
 
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

describe('DescriptorInfo', () => {
  describe.each(Descriptors)('%s', (_, md) => {
    let info
    beforeEach(() => {
      info = Es6DescriptorInfo.create(md.descriptor)
    })

    it('does not equal null', () => {
      expect(info.equals(null)).toBe(false)
    })
    it('does not equal the other descriptors', () => {
      for (const [_, otherMd] of Descriptors) {
        if (otherMd === md) continue
        const otherInfo = Es6DescriptorInfo.create(otherMd.descriptor)
        expect(info.equals(otherInfo)).toBe(false)
        expect(otherInfo.equals(info)).toBe(false)
      }
    })
    it('is correct info type', () => {
      expect(info instanceof md.infoType).toBe(true)
    })
    it('equals itself', () => {
      expect(info.equals(info)).toBe(true)
    })
    it('has a descriptor', () => {
      expect(info.descriptor).toBe(md.descriptor)
    })
    it('has correct predicates', () => {
      expect(info.type).toBe(md.type)

      expect(info.isGetter).toBe(md.type == 'getter')
      expect(info.isSetter).toBe(md.type == 'setter')
      expect(info.isProperty).toBe(md.type == 'property')
      expect(info.isAccessor).toBe(md.type == 'getter' || md.type == 'setter' || md.type == 'property')

      const d = md.descriptor
      expect(info.isConfigurable).toBe(d.configurable == true)
      expect(info.isEnumerable).toBe(d.enumerable == true)
      expect(info.isWritable).toBe(d.writable == true)

      expect(info.isAbstract).toBe(md.isAbstract == true)
    })
    it('has correct pivots', () => {
      const pivots = Array.from(info.pivots())
      if (md.isAbstract) {
        expect(pivots).toContain('abstract')
      }
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
