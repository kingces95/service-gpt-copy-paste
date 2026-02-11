import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialType } from '@kingjs/partial-type'
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
        const declarations = [...PartialReflect.partialExtensions(derived)]
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
          const declarations = [...PartialReflect.partialExtensions(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
      })
    })
  })
})

describe('An extension', () => {
  let extension
  beforeEach(() => {
    extension = class MyExtension extends PartialClass { }
  })
  it('should have no own declarations', () => {
    const declarations = [...PartialReflect.ownPartialTypes(extension)]
    expect(declarations).toHaveLength(0)
  })
  it('should have no declarations', () => {
    const declarations = [...PartialReflect.partialExtensions(extension)]
    expect(declarations).toHaveLength(0)
  })
  it('should nave no own names or symbols', () => {
    const keys = [...PartialReflect.ownKeys(extension)]
    expect(keys).toHaveLength(0)
  })
  it('should have no names or symbols', () => {
    const keys = [...PartialReflect.keys(extension).filter(isKey)]
    expect(keys).toHaveLength(0)
  })
  describe('with a sub extension', () => {
    let subExtension
    beforeEach(() => {
      subExtension = class extends PartialClass { }
      extension[Extends] = [ subExtension ]
    })
    it('should have the sub extension as an own declaration', () => {
      const declarations = [...PartialReflect.ownPartialTypes(extension)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(subExtension)
    })
    describe('that has a subMember', () => {
      let subMember
      beforeEach(() => {
        subMember = function subMember() { }
        subExtension.prototype.subMember = subMember
      })
      it('should have the subMember as a key', () => {
        const keys = [...PartialReflect.keys(extension).filter(isKey)]
        expect(keys).toHaveLength(1)
        expect(keys[0]).toBe('subMember')
      })
      it('should not have the subMember as an own key', () => {
        const keys = [...PartialReflect.ownKeys(extension)]
        expect(keys).toHaveLength(0)
      })
      it('should report subExtension as host for subMember', () => {
        const host = PartialReflect.getHost(extension, 'subMember')
        expect(host).toBe(subExtension)
      })
      it('should report no hosts for subMember', () => {
        const hosts = [...PartialReflect.virtualHosts(extension, 'subMember')]
        expect(hosts).toHaveLength(0)
      })
    })
    describe('that also has a sub extension with a member', () => {
      let subSubExtension
      let subSubMember
      beforeEach(() => {
        subSubMember = function member() { }
        subSubExtension = class extends PartialClass { }
        subExtension[Extends] = [ subSubExtension ]
        subSubExtension.prototype.member = subSubMember
      })
      it('should not have the sub sub extension as an own declaration', () => {
        const declarations = [...PartialReflect.ownPartialTypes(extension)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(subExtension)
      })
      it('should have the sub sub extension as a declaration', () => {
        const actual = new Set(PartialReflect.partialExtensions(extension))
        const expected = new Set([ subExtension, subSubExtension ])
        expect(actual).toEqual(expected)
      })
      it('should not have the member as an own name or symbol', () => {
        const keys = [...PartialReflect.ownKeys(extension)]
        expect(keys).toHaveLength(0)
      })
      it('should have the member as a name or symbol', () => {
        const keys = [...PartialReflect.keys(extension).filter(isKey)]
        expect(keys).toHaveLength(1)
        expect(keys[0]).toBe('member')
      })
      describe('and a MyPartialClass with a different member', () => {
        let MyPartialClass, myPartialClass, myMember
        beforeEach(() => {
          myMember = function member() { }
          MyPartialClass = class extends PartialType { }
          myPartialClass = class extends MyPartialClass { }
          myPartialClass.prototype.differentMember = myMember
          extension[Extends].push(myPartialClass)
        })
        it('should assert that MyPartialClass is not a PartialClass', () => {
          expect(() => {
            [...PartialReflect.partialExtensions(extension)]
          }).toThrow(`Associate type "myPartialClass" is of an unexpected type.`)
        })
      })
    })
  })
  describe('that defines a member', () => {
    let member
    beforeEach(() => {
      member = function member() { }
      extension.prototype.member = member
    })
    it('should have the member as an own name or symbol', () => {
      const keys = [...PartialReflect.ownKeys(extension)]
      expect(keys).toHaveLength(1)
      expect(keys[0]).toBe('member')
    })
    it('should have the member as a name or symbol', () => {
      const keys = [...PartialReflect.keys(extension).filter(isKey)]
      expect(keys).toHaveLength(1)
      expect(keys[0]).toBe('member')
    })
  })
  describe('that defines a symbolic member', () => {
    let symbol, member
    beforeEach(() => {
      symbol = Symbol('member')
      member = function member() { }
      extension.prototype[symbol] = member
    })
    it('should have the symbolic member as an own name or symbol', () => {
      const keys = [...PartialReflect.ownKeys(extension)]
      expect(keys).toHaveLength(1)
      expect(keys[0]).toBe(symbol)
    })
  })
})
