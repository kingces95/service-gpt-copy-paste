import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6DescriptorInfo,
  Es6DataDescriptorInfo,
  Es6ValueDescriptorInfo,
  Es6AccessorDescriptorInfo,
  Es6MethodDescriptorInfo,
} from './es6-descriptor-info'

describe('Es6DescriptorInfo', () => {
  let descInfo
  describe('with a class definition', () => {
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({
        value: class MyClass {},
        writable: Es6DataDescriptorInfo.DefaultWritable, 
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable 
      })
    })
    it('is a data descriptor', () => {
      expect(descInfo.type).toBe(Es6DataDescriptorInfo.Tag)
      expect(descInfo instanceof Es6ValueDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DataDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DescriptorInfo).toBe(true)
      expect(descInfo.isData).toBe(true)
      expect(descInfo.isMethod).toBe(false)
      expect(descInfo.hasValue).toBe(true)
      expect(descInfo.hasGetter).toBe(false)
      expect(descInfo.hasSetter).toBe(false)
    })
    it('is equal to itself', () => {
      expect(descInfo.equals(descInfo)).toBe(true)
    })
    it('is unequal to null', () => {
      expect(descInfo.equals(null)).toBe(false)
    })
    describe('copied', () => {
      let copy
      let descInfoCopy
      beforeEach(() => {
        descInfoCopy = Es6DescriptorInfo.create({ 
          value: class MyClass {},
          writable: Es6DataDescriptorInfo.DefaultWritable,
          enumerable: Es6DataDescriptorInfo.DefaultEnumerable,
          configurable: Es6DataDescriptorInfo.DefaultConfigurable
        })
        copy = descInfoCopy.descriptor
      })
      it('is unequal if configurable is different', () => {
        copy.configurable = !descInfo.isConfigurable
        expect(descInfo.equals(descInfoCopy)).toBe(false)
      })
      it('is unequal if enumerable is different', () => {
        copy.enumerable = !descInfo.isEnumerable
        expect(descInfo.equals(descInfoCopy)).toBe(false)
      })
      it('is unequal if writable is different', () => {
        copy.writable = !descInfo.isWritable
        expect(descInfo.equals(descInfoCopy)).toBe(false)
      })
      it('is unequal if value is different', () => {
        copy.value = class MyClass2 {}
        expect(descInfo.equals(descInfoCopy)).toBe(false)
      })
    })
  })
  describe('with a function definition that is enumerable', () => {
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        value: function myFunction() {},
        writable: Es6DataDescriptorInfo.DefaultWritable,
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable 
      })
    })
    it('is a data descriptor', () => {
      expect(descInfo.type).toBe(Es6DataDescriptorInfo.Tag)
      expect(descInfo instanceof Es6ValueDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DataDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DescriptorInfo).toBe(true)
      expect(descInfo.isData).toBe(true)
      expect(descInfo.isMethod).toBe(false)
      expect(descInfo.hasValue).toBe(true)
      expect(descInfo.hasGetter).toBe(false)
      expect(descInfo.hasSetter).toBe(false)
    })
  })
  describe('with NaN value descriptor', () => {
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({
        value: NaN,
        writable: Es6DataDescriptorInfo.DefaultWritable, 
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable 
      })
    })
    it('is equal to another NaN value descriptor', () => {
      const otherDescInfo = Es6DescriptorInfo.create({ 
        value: NaN,
        writable: Es6DataDescriptorInfo.DefaultWritable, 
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable 
      })
      expect(descInfo.equals(otherDescInfo)).toBe(true)
    })
  })
  describe('with value descriptor', () => {
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        value: 42, 
        writable: Es6DataDescriptorInfo.DefaultWritable, 
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable 
      })
    })
    it('does not equal a non-value descriptor', () => {
      const otherDescInfo = Es6DescriptorInfo.create({ 
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable,
        get: function() { return 42 },
      })
      expect(descInfo.equals(otherDescInfo)).toBe(false)
    })
    it('does not equal a value descriptor with different value', () => {
      const otherDescInfo = Es6DescriptorInfo.create({ 
        value: 43,
        writable: Es6DataDescriptorInfo.DefaultWritable, 
        enumerable: Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: Es6DataDescriptorInfo.DefaultConfigurable 
      })
      expect(descInfo.equals(otherDescInfo)).toBe(false)
    })
    it('is a data descriptor', () => {
      expect(descInfo.type).toBe(Es6DataDescriptorInfo.Tag)
      expect(descInfo instanceof Es6ValueDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DataDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DescriptorInfo).toBe(true)
      expect(descInfo.isData).toBe(true)
      expect(descInfo.isMethod).toBe(false)
      expect(descInfo.hasValue).toBe(true)
      expect(descInfo.hasGetter).toBe(false)
      expect(descInfo.hasSetter).toBe(false)
    })
    it('has correct metadata', () => {
      expect(descInfo.value).toBe(42)
      expect(descInfo.isWritable).toBe(true)
      expect(descInfo.isEnumerable).toBe(true)
      expect(descInfo.isConfigurable).toBe(true)
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('{ value: [number] }')
    })
  })
  describe('with value descriptor with inverted defaults', () => {
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        value: 42,
        writable: !Es6DataDescriptorInfo.DefaultWritable, 
        enumerable: !Es6DataDescriptorInfo.DefaultEnumerable, 
        configurable: !Es6DataDescriptorInfo.DefaultConfigurable 
      })
    })
    it('has the correct metadata', () => {
      expect(descInfo.value).toBe(42)
      expect(descInfo.isWritable).toBe(false)
      expect(descInfo.isEnumerable).toBe(false)
      expect(descInfo.isConfigurable).toBe(false)
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('sealed const hidden { value: [number] }')
    })
  })
  describe('with accessor descriptor', () => {
    const getter = function myGetter() {}
    const setter = function mySetter(v) {}
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        get: getter,
        set: setter,
        enumerable: Es6AccessorDescriptorInfo.DefaultEnumerable, 
        configurable: Es6AccessorDescriptorInfo.DefaultConfigurable 
      })
    })
    it('does not equal an accessor descriptor with different setter', () => {
      const otherDescInfo = Es6DescriptorInfo.create({ 
        get: getter,
        set: function otherSetter(v) {},
        enumerable: Es6AccessorDescriptorInfo.DefaultEnumerable, 
        configurable: Es6AccessorDescriptorInfo.DefaultConfigurable 
      })
      expect(descInfo.equals(otherDescInfo)).toBe(false)
      expect(otherDescInfo.equals(descInfo)).toBe(false)
    })
    it('does not equal an accessor descriptor with different getter', () => {
      const otherDescInfo = Es6DescriptorInfo.create({ 
        get: function otherGetter() {},
        set: setter,
        enumerable: Es6AccessorDescriptorInfo.DefaultEnumerable, 
        configurable: Es6AccessorDescriptorInfo.DefaultConfigurable
      })
      expect(descInfo.equals(otherDescInfo)).toBe(false)
      expect(otherDescInfo.equals(descInfo)).toBe(false)
    })
    it('is an accessor descriptor', () => {
      expect(descInfo.type).toBe(Es6AccessorDescriptorInfo.Tag)
      expect(descInfo instanceof Es6AccessorDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6MethodDescriptorInfo).toBe(false)
      expect(descInfo instanceof Es6DescriptorInfo).toBe(true)
      expect(descInfo.isAccessor).toBe(true)
      expect(descInfo.isMethod).toBe(false)
      expect(descInfo.hasValue).toBe(false)
      expect(descInfo.hasGetter).toBe(true)
      expect(descInfo.hasSetter).toBe(true)
    })
    it('has correct getter and setter', () => {
      expect(descInfo.getter).toBe(getter)
      expect(descInfo.setter).toBe(setter)
    })
    it('has correct metadata', () => {
      expect(descInfo.isEnumerable).toBe(false)
      expect(descInfo.isConfigurable).toBe(true)
      expect(descInfo.isWritable).toBeUndefined()
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('{ get; set }')
    })
    it('is equal to itself', () => {
      expect(descInfo.equals(descInfo)).toBe(true)
    })
    describe('copied', () => {
      let copy
      let descInfoCopy
      beforeEach(() => {
        descInfoCopy = Es6DescriptorInfo.create({ 
          get: getter,
          set: setter,
          enumerable: Es6AccessorDescriptorInfo.DefaultEnumerable, 
          configurable: Es6AccessorDescriptorInfo.DefaultConfigurable 
        })
        copy = descInfoCopy.descriptor
      })
      it('is unequal if getter is different', () => {
        const otherGetter = function otherGetter() {}
        copy.get = otherGetter
        expect(descInfo.equals(descInfoCopy)).toBe(false)
      })
      it('is unequal if setter is different', () => {
        const otherSetter = function otherSetter(v) {}
        copy.set = otherSetter
        expect(descInfo.equals(descInfoCopy)).toBe(false)
      })
    })
  })
  describe('with accessor descriptor with only getter', () => {
    const getter = function myGetter() {}
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        get: getter,
        enumerable: Es6AccessorDescriptorInfo.DefaultEnumerable, 
        configurable: Es6AccessorDescriptorInfo.DefaultConfigurable 
      })
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('{ get }')
    })
  })
  describe('with accessor descriptor with only getter and inverted defaults', () => {
    const setter = function mySetter(v) {}
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        set: setter,
        enumerable: !Es6AccessorDescriptorInfo.DefaultEnumerable, 
        configurable: !Es6AccessorDescriptorInfo.DefaultConfigurable 
      })
    })
    it('has correct getter and setter', () => {
      expect(descInfo.getter).toBeUndefined()
      expect(descInfo.setter).toBe(setter)
    })
    it('has correct metadata', () => {
      expect(descInfo.isEnumerable).toBe(true)
      expect(descInfo.isConfigurable).toBe(false)
      expect(descInfo.isWritable).toBeUndefined()
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('sealed enumerable { set }')
    })  
  })
  describe('with method descriptor', () => {
    const method = function myMethod() {}
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        value: method,
        writable: Es6MethodDescriptorInfo.DefaultWritable,
        enumerable: Es6MethodDescriptorInfo.DefaultEnumerable, 
        configurable: Es6MethodDescriptorInfo.DefaultConfigurable 
      })
    })
    it('is a method descriptor', () => {
      expect(descInfo.type).toBe(Es6MethodDescriptorInfo.Tag)
      expect(descInfo instanceof Es6MethodDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6ValueDescriptorInfo).toBe(true)
      expect(descInfo instanceof Es6DescriptorInfo).toBe(true)
      expect(descInfo.isMethod).toBe(true)
      expect(descInfo.hasValue).toBe(true)
      expect(descInfo.hasGetter).toBe(false)
      expect(descInfo.hasSetter).toBe(false)
    })
    it('has correct method', () => {
      expect(descInfo.value).toBe(method)
    })
    it('has correct metadata', () => {
      expect(descInfo.isWritable).toBe(true)
      expect(descInfo.isEnumerable).toBe(false)
      expect(descInfo.isConfigurable).toBe(true)
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('function')
    })
  })
  describe('with method descriptor with inverted defaults', () => {
    const method = function myMethod() {}
    beforeEach(() => {
      descInfo = Es6DescriptorInfo.create({ 
        value: method,
        // writable must be false for methods
        enumerable: Es6MethodDescriptorInfo.DefaultEnumerable, 
        writable: !Es6MethodDescriptorInfo.DefaultWritable,
        configurable: !Es6MethodDescriptorInfo.DefaultConfigurable 
      })
    })
    it('has correct method', () => {
      expect(descInfo.value).toBe(method)
    })
    it('has correct metadata', () => {
      expect(descInfo.isWritable).toBe(false)
      expect(descInfo.isEnumerable).toBe(false)
      expect(descInfo.isConfigurable).toBe(false)
    })
    it('toString is correct', () => {
      expect(descInfo.toString()).equals('sealed const function')
    })
  })
})