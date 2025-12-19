import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialObject } from '@kingjs/partial-object'
import { PartialReflect } from '@kingjs/partial-reflect'
import { 
  PartialClass, 
  Extensions 
} from '@kingjs/extension-group'

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should yield no own extensions', () => {
    const declarations = [...PartialReflect.ownCollections(type)]
    expect(declarations).toHaveLength(0)
  })
  describe('after being extended by an PartialClass with a SubExtension', () => {
    let extension, subExtension
    beforeEach(() => {
      subExtension = class SubExtension extends PartialClass { }
      extension = class MyExtension extends PartialClass { 
        static [Extensions] = [ subExtension, subExtension ]
      }
      PartialReflect.merge(type, extension)
    })
    it('should yield the extensions', () => {
      const declarations = [...PartialReflect.ownCollections(type)]
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
      PartialReflect.merge(type, extension)
    })
    it('should have the member', () => {
      expect(type.prototype.member).toBe(member)
    })
  })
  describe('after being extended by an empty extension', () => {
    let extension
    beforeEach(() => {
      extension = class MyExtension extends PartialClass { }
      PartialReflect.merge(type, extension)
    })
    it('should yield the extension as an own PartialClass declaration', () => {
      const declarations = [...PartialReflect.ownCollections(type)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(extension)
    })
    describe('then used as a base class', () => {
      let derived
      beforeEach(() => {
        derived = class extends type { }
      })
      it('should yield the extension', () => {
        const declarations = [...PartialReflect.collections(derived)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(extension)
      })
      describe('which is also extended by an PartialClass', () => {
        beforeEach(() => {
          PartialReflect.merge(derived, extension)
        })
        it('should yield the extension as own', () => {
          const declarations = [...PartialReflect.ownCollections(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
        it('should yield the extension', () => {
          const declarations = [...PartialReflect.collections(derived)]
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
    const declarations = [...PartialReflect.ownCollections(extension)]
    expect(declarations).toHaveLength(0)
  })
  it('should have no declarations', () => {
    const declarations = [...PartialReflect.collections(extension)]
    expect(declarations).toHaveLength(0)
  })
  it('should nave no own names or symbols', () => {
    const keys = [...PartialReflect.ownKeys(extension)]
    expect(keys).toHaveLength(0)
  })
  it('should have no names or symbols', () => {
    const keys = [...PartialReflect.keys(extension)]
    expect(keys).toHaveLength(0)
  })
  describe('with a sub extension', () => {
    let subExtension
    beforeEach(() => {
      subExtension = class extends PartialClass { }
      extension[Extensions] = [ subExtension ]
    })
    it('should have the sub extension as an own declaration', () => {
      const declarations = [...PartialReflect.ownCollections(extension)]
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
        const keys = [...PartialReflect.keys(extension)]
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
      it('should report subExtension as only host for subMember', () => {
        const hosts = [...PartialReflect.hosts(extension, 'subMember')]
        expect(hosts).toHaveLength(1)
        expect(hosts[0]).toBe(subExtension)
      })
    })
    describe('that also has a sub extension with a member', () => {
      let subSubExtension
      let subSubMember
      beforeEach(() => {
        subSubMember = function member() { }
        subSubExtension = class extends PartialClass { }
        subExtension[Extensions] = [ subSubExtension ]
        subSubExtension.prototype.member = subSubMember
      })
      it('should not have the sub sub extension as an own declaration', () => {
        const declarations = [...PartialReflect.ownCollections(extension)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(subExtension)
      })
      it('should have the sub sub extension as a declaration', () => {
        const actual = new Set(PartialReflect.collections(extension))
        const expected = new Set([ subExtension, subSubExtension ])
        expect(actual).toEqual(expected)
      })
      it('should not have the member as an own name or symbol', () => {
        const keys = [...PartialReflect.ownKeys(extension)]
        expect(keys).toHaveLength(0)
      })
      it('should have the member as a name or symbol', () => {
        const keys = [...PartialReflect.keys(extension)]
        expect(keys).toHaveLength(1)
        expect(keys[0]).toBe('member')
      })
      describe('and a MyPartialClass with a different member', () => {
        let MyPartialClass, myPartialClass, myMember
        beforeEach(() => {
          myMember = function member() { }
          MyPartialClass = class extends PartialObject { }
          myPartialClass = class extends MyPartialClass { }
          myPartialClass.prototype.differentMember = myMember
          extension[Extensions].push(myPartialClass)
        })
        it('should assert that MyPartialClass is not an PartialClass', () => {
          expect(() => {
            [...PartialReflect.collections(extension)]
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
      const keys = [...PartialReflect.keys(extension)]
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
