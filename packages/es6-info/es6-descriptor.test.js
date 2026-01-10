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

import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'

const Getter = {
  name: 'getter',
  descriptor: { 
    get: function myGetter() {},
    enumerable: Es6GetterDescriptor.DefaultEnumerable,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptor,
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
  infoType: Es6SetterDescriptor,
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
  infoType: Es6PropertyDescriptor,
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
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptor,
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
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptor,
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
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: false,
  },
  infoType: Es6MethodDescriptor,
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
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptor,
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
    configurable: Es6MethodDescriptor.DefaultConfigurable,
    writable: Es6MethodDescriptor.DefaultWritable,
  },
  infoType: Es6MethodDescriptor,
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
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptor,
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
    configurable: Es6FieldDescriptor.DefaultConfigurable,
    writable: Es6FieldDescriptor.DefaultWritable,
  },
  infoType: Es6FieldDescriptor,
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
    it('has correct predicates', () => {
      // expect(info.type).toBe(md.type)
      // expect(info.isGetter).toBe(!!md.isGetter)
      // expect(info.isSetter).toBe(!!md.isSetter)
      // expect(info.isProperty).toBe(!!md.isProperty)
      // expect(info.isAccessor).toBe(!!md.isAccessor)

      // expect(info.isConfigurable).toBe(md.isConfigurable == true)
      // expect(info.isEnumerable).toBe(md.isEnumerable == true)
      // expect(info.isWritable).toBe(md.isWritable == true)

      // expect(info.isAbstract).toBe(md.isAbstract == true)

      // use declarative Es6Descriptor to test same

    })
    // it('toString is correct', () => {
    //   expect(info.toString()).toBe(md.toString)
    // })
    // it('has correct pivots', () => {
    //   const pivots = Array.from(info.pivots())
    //   if (md.isAbstract) {
    //     expect(pivots).toContain('abstract')
    //   }
    // })
    // it('has correct modifiers', () => {
    //   const actual = Array.from(info.modifiers())
    //   const expected = []
    //   if (md.isConfigurable) expected.push('configurable')
    //   if (md.isEnumerable) expected.push('enumerable')
    //   if (md.isWritable) expected.push('writable')
    //   expect(actual).toEqual(expected)
    // })
    // it('has correct getter', () => {
    //   expect(info.getter).toBe(md.descriptor.get)
    // })
    // it('has correct setter', () => {
    //   expect(info.setter).toBe(md.descriptor.set)
    // })
    // it('has correct returnType', () => {
    //   expect(info.returnType).toBe(md.returnType)
    // })
  })
})

