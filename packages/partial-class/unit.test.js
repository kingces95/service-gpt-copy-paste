import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect, isKey } from '@kingjs/partial-reflect'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { extend } from '@kingjs/partial-extend'

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should yield no own extensions', () => {
    const declarations = [...PartialReflect.ownPartialTypes(type)]
    expect(declarations).toHaveLength(0)
  })
  describe('after being extended by a PartialClass with a declared Extension', () => {
    let extension, subExtension
    beforeEach(() => {
      subExtension = class SubExtension extends PartialClass { }
      extension = class MyExtension extends PartialClass { 
        static [Extends] = [ subExtension, subExtension ]
      }
      extend(type, extension)
    })
    it('should yield the extensions', () => {
      const declarations = [...PartialReflect.ownPartialTypes(type)]
      expect(declarations).toHaveLength(2)
      expect(declarations).toContain(extension)
      expect(declarations).toContain(subExtension)
    })
  })
  describe('after being extended by an extension with a member', () => {
    let extension, member
    beforeEach(() => {
      member = function member() { }
      extension = class MyExtension extends PartialClass { }
      extension.prototype.member = member
      extend(type, extension)
    })
    it('should have the member', () => {
      expect(type.prototype.member).toBe(member)
    })
  })
  describe('after being extended by an empty extension', () => {
    let extension
    beforeEach(() => {
      extension = class MyExtension extends PartialClass { }
      extend(type, extension)
    })
    it('should yield the extension as an own PartialClass declaration', () => {
      const declarations = [...PartialReflect.ownPartialTypes(type)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(extension)
    })
    describe('then used as a base class', () => {
      let derived
      beforeEach(() => {
        derived = class extends type { }
      })
      it('should yield the extension', () => {
        const declarations = [...PartialReflect.partialTypes(derived)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(extension)
      })
      describe('which is also extended by an PartialClass', () => {
        beforeEach(() => {
          extend(derived, extension)
        })
        it('should yield the extension as own', () => {
          const declarations = [...PartialReflect.ownPartialTypes(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
        it('should yield the extension', () => {
          const declarations = [...PartialReflect.partialTypes(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
      })
    })
  })
})

describe('A PartialClass', () => {
  let myPartialClass
  beforeEach(() => {
    myPartialClass = class MyPartialClass extends PartialClass { }
  })
  it('should have no own partialTypes', () => {
    const partialTypes = [...PartialReflect.ownPartialTypes(myPartialClass)]
    expect(partialTypes).toHaveLength(0)
  })
  it('should have no partialTypes', () => {
    const partialTypes = [...PartialReflect.partialTypes(myPartialClass)]
    expect(partialTypes).toHaveLength(0)
  })
  it('should nave no own names or symbols', () => {
    const keys = [...PartialReflect.ownKeys(myPartialClass)]
    expect(keys).toHaveLength(0)
  })
  it('should have no names or symbols', () => {
    const keys = [...PartialReflect.keys(myPartialClass).filter(isKey)]
    expect(keys).toHaveLength(0)
  })
  describe('which extended a base PartialClass', () => {
    let basePartialClass
    beforeEach(() => {
      basePartialClass = class BasePartialClass extends PartialClass { }
      myPartialClass[Extends] = [ basePartialClass ]
    })
    it('should have BasePartialType as an own PartialClass', () => {
      const ownPartialTypes = [...PartialReflect.ownPartialTypes(myPartialClass)]
      expect(ownPartialTypes).toHaveLength(1)
      expect(ownPartialTypes[0]).toBe(basePartialClass)
    })
    describe('that has a baseMember', () => {
      let baseMember
      beforeEach(() => {
        baseMember = function baseMember() { }
        basePartialClass.prototype.baseMember = baseMember
      })
      it('should have the baseMember as a key', () => {
        const keys = [...PartialReflect.keys(myPartialClass).filter(isKey)]
        expect(keys).toHaveLength(1)
        expect(keys[0]).toBe('baseMember')
      })
      it('should not have the baseMember as an own key', () => {
        const keys = [...PartialReflect.ownKeys(myPartialClass)]
        expect(keys).toHaveLength(0)
      })
      it('should report BasePartialClass as the final host for baseMember', () => {
        const host = PartialReflect.getFinalHost(myPartialClass, 'baseMember')
        expect(host).toBe(basePartialClass)
      })
      it('should report MyPartialClass and BasePartialClass as hosts for baseMember', () => {
        const hosts = [...PartialReflect.hosts(myPartialClass, 'baseMember')]
        const expected = new Set([ myPartialClass, basePartialClass ])
        expect(new Set(hosts)).toEqual(expected)
      })
    })
    describe('which extended a root PartialClass', () => {
      let rootExtension
      let rootMember
      beforeEach(() => {
        rootMember = function rootMember() { }
        rootExtension = class extends PartialClass { }
        basePartialClass[Extends] = [ rootExtension ]
        rootExtension.prototype.member = rootMember
      })
      it('should not have root PartialClass as an own partial type', () => {
        const declarations = [...PartialReflect.ownPartialTypes(myPartialClass)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(basePartialClass)
      })
      it('should have the root PartialClass as a partial type', () => {
        const actual = new Set(PartialReflect.partialTypes(myPartialClass))
        const expected = new Set([ basePartialClass, rootExtension ])
        expect(actual).toEqual(expected)
      })
      it('should not have the root member as a key', () => {
        const keys = [...PartialReflect.ownKeys(myPartialClass)]
        expect(keys).toHaveLength(0)
      })
      it('should have the root member as a key', () => {
        const keys = [...PartialReflect.keys(myPartialClass).filter(isKey)]
        expect(keys).toHaveLength(1)
        expect(keys[0]).toBe('member')
      })
    })
  })
  describe('that defines a member', () => {
    let member
    beforeEach(() => {
      member = function member() { }
      myPartialClass.prototype.member = member
    })
    it('should have the member as an own name or symbol', () => {
      const keys = [...PartialReflect.ownKeys(myPartialClass)]
      expect(keys).toHaveLength(1)
      expect(keys[0]).toBe('member')
    })
    it('should have the member as a name or symbol', () => {
      const keys = [...PartialReflect.keys(myPartialClass).filter(isKey)]
      expect(keys).toHaveLength(1)
      expect(keys[0]).toBe('member')
    })
  })
  describe('that defines a symbolic member', () => {
    let symbol, member
    beforeEach(() => {
      symbol = Symbol('member')
      member = function member() { }
      myPartialClass.prototype[symbol] = member
    })
    it('should have the symbolic member as an own name or symbol', () => {
      const keys = [...PartialReflect.ownKeys(myPartialClass)]
      expect(keys).toHaveLength(1)
      expect(keys[0]).toBe(symbol)
    })
  })
})
