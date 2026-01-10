import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { 
  Es6DescriptorInfo,
  Es6MethodDescriptorInfo,
  Es6FieldDescriptorInfo,
  Es6GetterDescriptorInfo,
  Es6SetterDescriptorInfo,
  Es6PropertyDescriptorInfo,
} from './es6-descriptor-info'

const Getter = {
  name: 'getter',
  descriptor: { 
    get: function myGetter() {},
    enumerable: Es6GetterDescriptorInfo.DefaultEnumerable,
    configurable: Es6GetterDescriptorInfo.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptorInfo,
  type: 'getter',
  isGetter: true,
  isAccessor: true,
  isConfigurable: true,
  toString: 'configurable getter',
  returnType: 'object',
}

const OtherGetter = {
  ...Getter,
  name: 'other getter',
  descriptor: { 
    get: function otherGetter() {},
    enumerable: Es6GetterDescriptorInfo.DefaultEnumerable,
    configurable: Es6GetterDescriptorInfo.DefaultConfigurable,
  },
}

const Setter = {
  name: 'setter',
  descriptor: {
    set: function mySetter(v) {},
    enumerable: Es6SetterDescriptorInfo.DefaultEnumerable,
    configurable: Es6SetterDescriptorInfo.DefaultConfigurable,
  },
  infoType: Es6SetterDescriptorInfo,
  type: 'setter',
  isSetter: true,
  isAccessor: true,
  isConfigurable: true,
  toString: 'configurable setter',
  returnType: 'object',
}

const OtherSetter = {
  ...Setter,
  name: 'other setter',
  descriptor: {
    set: function otherSetter(v) {},
    enumerable: Es6SetterDescriptorInfo.DefaultEnumerable,
    configurable: Es6SetterDescriptorInfo.DefaultConfigurable,
  },
}

const Property = {
  name: 'property',
  descriptor: {
    get: function myPropertyGetter() {},
    set: function myPropertySetter(v) {},
    enumerable: Es6PropertyDescriptorInfo.DefaultEnumerable,
    configurable: Es6PropertyDescriptorInfo.DefaultConfigurable,
  },
  infoType: Es6PropertyDescriptorInfo,
  type: 'property',
  isProperty: true,
  isAccessor: true,
  isConfigurable: true,
  toString: 'configurable property',
  returnType: 'object',
}

const Method = {
  name: 'method',
  descriptor: {
    value: function myMethod() {},
    enumerable: false,
    configurable: Es6MethodDescriptorInfo.DefaultConfigurable,
    writable: Es6MethodDescriptorInfo.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  isConfigurable: true,
  isWritable: true,
  toString: 'configurable writable function',
  returnType: 'function',
}

const VisibleMethod = {
  name: 'visible method',
  descriptor: {
    value: function myVisibleMethod() {},
    enumerable: true,
    configurable: Es6MethodDescriptorInfo.DefaultConfigurable,
    writable: Es6MethodDescriptorInfo.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  isEnumerable: true,
  isConfigurable: true,
  isWritable: true,
  toString: 'configurable enumerable writable function',
  returnType: 'function',
}

const ConstMethod = {
  name: 'const method',
  descriptor: {
    value: function myConstMethod() {},
    enumerable: false,
    configurable: Es6MethodDescriptorInfo.DefaultConfigurable,
    writable: false,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  isConfigurable: true,
  toString: 'configurable function',
  returnType: 'function',
}

const SealedMethod = {
  name: 'sealed method',
  descriptor: {
    value: function mySealedMethod() {},
    enumerable: false,
    configurable: false,
    writable: Es6MethodDescriptorInfo.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  isWritable: true,
  toString: 'writable function',
  returnType: 'function',
}

const AbstractMethod = {
  name: 'abstract method',
  descriptor: {
    value: abstract,
    enumerable: false,
    configurable: Es6MethodDescriptorInfo.DefaultConfigurable,
    writable: Es6MethodDescriptorInfo.DefaultWritable,
  },
  infoType: Es6MethodDescriptorInfo,
  type: 'method',
  isConfigurable: true,
  isWritable: true,
  isAbstract: true,
  toString: 'abstract configurable writable function',
  returnType: 'function',
}

const Number = {
  name: 'number',
  descriptor: {
    value: 42,
    enumerable: true,
    configurable: Es6FieldDescriptorInfo.DefaultConfigurable,
    writable: Es6FieldDescriptorInfo.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  isConfigurable: true,
  isWritable: true,
  isEnumerable: true,
  toString: 'configurable enumerable writable number',
  returnType: 'number',
}

const NanNumber = {
  name: 'NaN number',
  descriptor: {
    value: NaN,
    enumerable: true,
    configurable: Es6FieldDescriptorInfo.DefaultConfigurable,
    writable: Es6FieldDescriptorInfo.DefaultWritable,
  },
  infoType: Es6FieldDescriptorInfo,
  type: 'field',
  isConfigurable: true,
  isWritable: true,
  isEnumerable: true,
  toString: 'configurable enumerable writable number',
  returnType: 'number',
}

const Descriptors = [
  [ Getter.name, Getter ],
  [ OtherGetter.name, OtherGetter ],
  [ Setter.name, Setter ],
  [ OtherSetter.name, OtherSetter ],
  [ Property.name, Property ],
  [ Method.name, Method ],
  [ VisibleMethod.name, VisibleMethod ],
  [ ConstMethod.name, ConstMethod ],
  [ SealedMethod.name, SealedMethod ],
  [ AbstractMethod.name, AbstractMethod ],
  [ Number.name, Number ],
  [ NanNumber.name, NanNumber ],
]
 
describe('descriptor', () => {
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
      expect(info.isGetter).toBe(!!md.isGetter)
      expect(info.isSetter).toBe(!!md.isSetter)
      expect(info.isProperty).toBe(!!md.isProperty)
      expect(info.isAccessor).toBe(!!md.isAccessor)

      expect(info.isConfigurable).toBe(md.isConfigurable == true)
      expect(info.isEnumerable).toBe(md.isEnumerable == true)
      expect(info.isWritable).toBe(md.isWritable == true)

      expect(info.isAbstract).toBe(md.isAbstract == true)
    })
    it('toString is correct', () => {
      expect(info.toString()).toBe(md.toString)
    })
    it('has correct pivots', () => {
      const pivots = Array.from(info.pivots())
      if (md.isAbstract) {
        expect(pivots).toContain('abstract')
      }
    })
    it('has correct modifiers', () => {
      const actual = Array.from(info.modifiers())
      const expected = []
      if (md.isConfigurable) expected.push('configurable')
      if (md.isEnumerable) expected.push('enumerable')
      if (md.isWritable) expected.push('writable')
      expect(actual).toEqual(expected)
    })
    it('has correct getter', () => {
      expect(info.getter).toBe(md.descriptor.get)
    })
    it('has correct setter', () => {
      expect(info.setter).toBe(md.descriptor.set)
    })
    it('has correct returnType', () => {
      expect(info.returnType).toBe(md.returnType)
    })
  })
})
