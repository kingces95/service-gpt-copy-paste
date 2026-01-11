import assert from 'assert'
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

const GetterMd = {
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

const EnumerableGetterMd = {
  name: 'enumerable getter',
  descriptor: { 
    get: function myEnumerableGetter() {},
    enumerable: true,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
  infoType: Es6GetterDescriptorInfo,
  type: 'getter',
  modifiers: [ 'visible' ],
  toString: 'visible getter',
}

const OtherGetterMd = {
  ...GetterMd,
  name: 'other getter',
  descriptor: { 
    get: function otherGetter() {},
    enumerable: Es6GetterDescriptor.DefaultEnumerable,
    configurable: Es6GetterDescriptor.DefaultConfigurable,
  },
}

const SetterMd = {
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

const OtherSetterMd = {
  ...SetterMd,
  name: 'other setter',
  descriptor: {
    set: function otherSetter(v) {},
    enumerable: Es6SetterDescriptor.DefaultEnumerable,
    configurable: Es6SetterDescriptor.DefaultConfigurable,
  },
}

const PropertyMd = {
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

const MethodMd = {
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

const FunctionMd = {
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

const ConstMethodMd = {
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

const SealedMethodMd = {
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

const AbstractMethodMd = {
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

const NumberMd = {
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

const HiddenNumberMd = {
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

const ConstNumberMd = {
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

const NanNumberMd = {
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
  [ GetterMd.name, GetterMd ],
  [ EnumerableGetterMd.name, EnumerableGetterMd ],
  [ OtherGetterMd.name, OtherGetterMd ],
  [ SetterMd.name, SetterMd ],
  [ OtherSetterMd.name, OtherSetterMd ],
  [ PropertyMd.name, PropertyMd ],
  [ MethodMd.name, MethodMd ],
  [ FunctionMd.name, FunctionMd ],
  [ ConstMethodMd.name, ConstMethodMd ],
  [ SealedMethodMd.name, SealedMethodMd ],
  [ AbstractMethodMd.name, AbstractMethodMd ],
  [ NumberMd.name, NumberMd ],
  [ HiddenNumberMd.name, HiddenNumberMd ],
  [ ConstNumberMd.name, ConstNumberMd ],
  [ NanNumberMd.name, NanNumberMd ],
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
      expect(info.isAccessor).toBe(
        md.type == 'getter' 
        || md.type == 'setter' 
        || md.type == 'property')

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


class MyClass { }
class MyExtendedClass extends MyClass { }

function es6GetPrototypeOf(object) {
  if (object == null) return null

  const prototype = Object.getPrototypeOf(object)

  if (prototype == Function.prototype && object instanceof Function)
    return Object

  return prototype
}

describe('getPrototypeOf', () => {
  describe('Object', () => {
    const prototype = Object.getPrototypeOf(Object)
    it('is Function.prototype', () => {
      // Object is a function
      expect(prototype == Function.prototype).toBe(true)
    })
    it('typeof is "function"', () => {
      // is callable
      expect(typeof prototype == 'function').toBe(true)
    })
    it('not instanceof Function', () => {
      expect(prototype instanceof Function).toBe(false)
    })
  })
  describe('Function.prototype', () => {
    const prototype = Object.getPrototypeOf(Function.prototype)
    it('is Object.prototype', () => {
      // everything is an object
      expect(prototype == Object.prototype).toBe(true)
    })
    it('typeof is "object"', () => {
      // not callable
      expect(typeof prototype).toBe('object')
    })
    it('not instanceof Function', () => {
      expect(prototype instanceof Function).toBe(false)
    })
  })
  describe('Function', () => {
    const prototype = Object.getPrototypeOf(Function)
    it('is Function.prototype', () => {
      // Function is a function
      expect(prototype == Function.prototype).toBe(true)
    })
    it('typeof is "function"', () => {
      expect(typeof prototype == 'function').toBe(true)
    })
    it('not instanceof Function', () => {
      expect(prototype instanceof Function).toBe(false)
    })
  })
  describe('MyClass', () => {
    const prototype = Object.getPrototypeOf(MyClass)
    it('is Function.prototype', () => {
      // MyClass is a function
      expect(prototype == Function.prototype).toBe(true)
      expect(prototype instanceof Function).toBe(false)
    })
    it('typeof is "function"', () => {
      expect(typeof prototype == 'function').toBe(true)
    })
    it('not instanceof Function', () => {
      expect(prototype instanceof Function).toBe(false)
    })
  })
  describe('MyExtendedClass', () => {
    const prototype = Object.getPrototypeOf(MyExtendedClass)
    it('is MyClass', () => {
      // MyExtendedClass extends MyClass and is a function
      expect(prototype == MyClass).toBe(true)
    })
    it('typeof is "function"', () => {
      expect(typeof prototype == 'function').toBe(true)
    })
    it('instanceof Function', () => {
      expect(prototype instanceof Function).toBe(true)
    })
  })
})
