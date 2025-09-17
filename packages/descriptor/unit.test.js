import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Descriptor } from "@kingjs/descriptor"

const {
  get,
  hasData,
  hasMethod,
  hasClassPrototypeDefaults,
  hasMemberDeclarationDefaults,
  hasGetter,
  hasSetter,
  hasAccessor,
  hasValue,
  implementation,
} = Descriptor

function getter() { }
function setter() { }
function fn() { }

describe('A class', () => {
  let cls
  beforeEach(() => {
    [cls] = [class { }]
  })
  it('should not get the member', () => {
    const descriptor = get(cls.prototype, 'member')
    expect(descriptor).toBe(undefined)
  })
  describe('with a member', () => {
    beforeEach(() => {
      Object.defineProperties(cls.prototype, { member: { value: fn } })
    })
    describe('used as a base class', () => {
      let derived
      beforeEach(() => {
        [derived] = [class extends cls { }]
      })
      it('should get the member from the base class', () => {
        const descriptor = get(derived.prototype, 'member')
        expect(descriptor.value).toBe(fn)
      })
    })
  })
})

describe('A class with a method and accessor', () => {
  let cls
  beforeEach(() => {
    [cls] = [class {
      method() { }
      get accessor() { }
    }]
  })
  describe('the prototype descriptor', () => {
    let descriptor
    beforeEach(() => {
      descriptor = Object.getOwnPropertyDescriptor(cls, 'prototype')
    })
    it('should be a class prototype defaults', () => {
      expect(hasClassPrototypeDefaults(descriptor)).toBe(true)
    })
    describe('with flipped enumerable', () => {
      beforeEach(() => {
        descriptor.enumerable = !descriptor.enumerable
      })
      it('should not have class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
    })
    describe('with flipped configurable', () => {
      beforeEach(() => {
        descriptor.configurable = !descriptor.configurable
      })
      it('should not have class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
    })
    describe('with flipped writable', () => {
      beforeEach(() => {
        descriptor.writable = !descriptor.writable
      })
      it('should not have class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
    })
  })
  describe('the method descriptor', () => {
    let descriptor
    beforeEach(() => {
      descriptor = Object.getOwnPropertyDescriptor(cls.prototype, 'method')
    })
    it('should have a method', () => {
      expect(hasMethod(descriptor)).toBe(true)
    })
    it('should be a member declaration defaults', () => {
      expect(hasMemberDeclarationDefaults(descriptor)).toBe(true)
    })
    describe('with flipped enumerable', () => {
      beforeEach(() => {
        descriptor.enumerable = !descriptor.enumerable
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with flipped configurable', () => {
      beforeEach(() => {
        descriptor.configurable = !descriptor.configurable
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with flipped writable', () => {
      beforeEach(() => {
        descriptor.writable = !descriptor.writable
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })  
  })
  describe('the accessor descriptor', () => {
    let descriptor
    beforeEach(() => {
      descriptor = Object.getOwnPropertyDescriptor(cls.prototype, 'accessor')
    })
    it('should have an accessor', () => {
      expect(hasAccessor(descriptor)).toBe(true)
    })
    it('should be a member declaration defaults', () => {
      expect(hasMemberDeclarationDefaults(descriptor)).toBe(true)
    })
    describe('with flipped enumerable', () => {
      beforeEach(() => {
        descriptor.enumerable = !descriptor.enumerable
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with flipped configurable', () => {
      beforeEach(() => {
        descriptor.configurable = !descriptor.configurable
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
  })
})

describe('A descriptor', () => {
  let descriptor
  describe('when an empty object', () => {
    beforeEach(() => {
      descriptor = { }
    })
    it('should not be an instance of Descriptor', () => {
      expect(descriptor instanceof Descriptor).toBe(false)
    })
  })
  describe('when null', () => {
    beforeEach(() => {
      descriptor = null
    })
    it('should not have a getter', () => {
      expect(hasGetter(descriptor)).toBe(false)
    })
    it('should not have a setter', () => {
      expect(hasSetter(descriptor)).toBe(false)
    })
    it('should not have an accessor', () => {
      expect(hasAccessor(descriptor)).toBe(false)
    })
    it('should not have a value', () => {
      expect(hasValue(descriptor)).toBe(false)
    })
    it('should have no members', () => {
      const members = [...implementation(descriptor)]
      expect(members.length).toBe(0)
    })
    it('should not be an instance of Descriptor', () => {
      expect(descriptor instanceof Descriptor).toBe(false)
    })
    it('should have no data', () => {
      expect(hasData(descriptor)).toBe(false)
    })
    it('should have no method', () => {
      expect(hasMethod(descriptor)).toBe(false)
    })
    it('should not be a class prototype defaults', () => {
      expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
    })
    it('should not be a member declaration defaults', () => {
      expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
    })
  })
  describe('accessor', () => {
    describe('with a getter', () => {
      beforeEach(() => {
        descriptor = { get: getter }
      })
      it('should have a getter', () => {
        expect(hasGetter(descriptor)).toBe(true)
      })
      it('should not have a setter', () => {
        expect(hasSetter(descriptor)).toBe(false)
      })
      it('should have an accessor', () => {
        expect(hasAccessor(descriptor)).toBe(true)
      })
      it('should not have a value', () => {
        expect(hasValue(descriptor)).toBe(false)
      })
      it('should have one member', () => {
        const members = [...implementation(descriptor)]
        expect(members.length).toBe(1)
        expect(members[0]).toBe(getter)
      })
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
      it('should not have data', () => {
        expect(hasData(descriptor)).toBe(false)
      })
      it('should not have method', () => {
        expect(hasMethod(descriptor)).toBe(false)
      })
      it('should not be a class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with a setter', () => {
      beforeEach(() => {
        descriptor = { set: setter }
      })
      it('should not have a getter', () => {
        expect(hasGetter(descriptor)).toBe(false)
      })
      it('should have a setter', () => {
        expect(hasSetter(descriptor)).toBe(true)
      })
      it('should have an accessor', () => {
        expect(hasAccessor(descriptor)).toBe(true)
      })
      it('should not have a value', () => {
        expect(hasValue(descriptor)).toBe(false)
      })
      it('should have one member', () => {
        const members = [...implementation(descriptor)]
        expect(members.length).toBe(1)
        expect(members[0]).toBe(setter)
      })
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
      it('should not have data', () => {
        expect(hasData(descriptor)).toBe(false)
      })
      it('should not have method', () => {
        expect(hasMethod(descriptor)).toBe(false)
      })
      it('should not be a class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with a getter and setter', () => {
      beforeEach(() => {
        descriptor = { get: getter, set: setter }
      })
      it('should have a getter', () => {
        expect(hasGetter(descriptor)).toBe(true)
      })
      it('should have a setter', () => {
        expect(hasSetter(descriptor)).toBe(true)
      })
      it('should have an accessor', () => {
        expect(hasAccessor(descriptor)).toBe(true)
      })
      it('should not have a value', () => {
        expect(hasValue(descriptor)).toBe(false)
      })
      it('should have two members', () => {
        const members = [...implementation(descriptor)]
        expect(members.length).toBe(2)
        expect(members).toContain(getter)
        expect(members).toContain(setter)
      })
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
      it('should not have data', () => {
        expect(hasData(descriptor)).toBe(false)
      })
      it('should not have method', () => {
        expect(hasMethod(descriptor)).toBe(false)
      })
      it('should not be a class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
  })
  describe('data', () => {
    describe('with a method', () => {
      beforeEach(() => {
        descriptor = { value: fn }
      })
      it('should not have a getter', () => {
        expect(hasGetter(descriptor)).toBe(false)
      })
      it('should not have a setter', () => {
        expect(hasSetter(descriptor)).toBe(false)
      })
      it('should not have an accessor', () => {
        expect(hasAccessor(descriptor)).toBe(false)
      })
      it('should have a value', () => {
        expect(hasValue(descriptor)).toBe(true)
      })
      it('should have one member', () => {
        const members = [...implementation(descriptor)]
        expect(members.length).toBe(1)
        expect(members[0]).toBe(fn)
      })
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
      it('should not have data', () => {
        expect(hasData(descriptor)).toBe(false)
      })
      it('should have method', () => {
        expect(hasMethod(descriptor)).toBe(true)
      })
      it('should be a class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(true)
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with a class', () => {
      beforeEach(() => {
        // a class is a function but considered data
        descriptor = { value: class { } }
      })
      it('should not have a getter', () => {
        expect(hasGetter(descriptor)).toBe(false)
      })
      it('should not have a setter', () => {
        expect(hasSetter(descriptor)).toBe(false)
      })
      it('should not have an accessor', () => {
        expect(hasAccessor(descriptor)).toBe(false)
      })
      it('should have a value', () => {
        expect(hasValue(descriptor)).toBe(true)
      })
      it('should have no members', () => {
        const members = [...implementation(descriptor)]
        expect(members.length).toBe(0)
      })
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
      it('should have data', () => {
        expect(hasData(descriptor)).toBe(true)
      })
      it('should not have a method', () => {
        expect(hasMethod(descriptor)).toBe(false)
      })
      it('should be a class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(true)
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
    describe('with null', () => {
      beforeEach(() => {
        descriptor = { value: null }
      })
      it('should not have a getter', () => {
        expect(hasGetter(descriptor)).toBe(false)
      })
      it('should not have a setter', () => {
        expect(hasSetter(descriptor)).toBe(false)
      })
      it('should not have an accessor', () => {
        expect(hasAccessor(descriptor)).toBe(false)
      })
      it('should have a value', () => {
        expect(hasValue(descriptor)).toBe(true)
      })
      it('should have no members', () => {
        const members = [...implementation(descriptor)]
        expect(members.length).toBe(0)
      })
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
      it('should have data', () => {
        expect(hasData(descriptor)).toBe(true)
      })
      it('should not have a method', () => {
        expect(hasMethod(descriptor)).toBe(false)
      })
      it('should not be a class prototype defaults', () => {
        expect(hasClassPrototypeDefaults(descriptor)).toBe(false)
      })
      it('should not be a member declaration defaults', () => {
        expect(hasMemberDeclarationDefaults(descriptor)).toBe(false)
      })
    })
  })
})
