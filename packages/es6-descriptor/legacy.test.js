import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Descriptor } from '@kingjs/descriptor'

const {
  hasData,
  implementation,
} = Es6Descriptor

const {
  get,
  hasGetter,
  hasSetter,
  hasAccessor,
  hasValue,
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
  describe('the accessor descriptor', () => {
    let descriptor
    beforeEach(() => {
      descriptor = Object.getOwnPropertyDescriptor(cls.prototype, 'accessor')
    })
    it('should have an accessor', () => {
      expect(hasAccessor(descriptor)).toBe(true)
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
      expect(descriptor instanceof Es6Descriptor).toBe(false)
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
    it('should not be an instance of Descriptor', () => {
      expect(descriptor instanceof Es6Descriptor).toBe(false)
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
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
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
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
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
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
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
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
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
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
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
      it('should be an instance of Descriptor', () => {
        expect(descriptor instanceof Descriptor).toBe(true)
      })
    })
  })
})
