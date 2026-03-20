import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract, isAbstract } from '@kingjs/abstract'
import { UserReflect } from '@kingjs/user-reflect'

const Member = Symbol('member')

class Empty { }
class EmptyExtendsObject extends Object { }
class EmptyExtendsNull extends null { }
class ClassWithMembers {
  static staticMember() { }
  member() { }
}
class ExtensionOfClassWithMembers extends ClassWithMembers { }
class OverrideOfClassWithMembers extends ClassWithMembers {
  static staticMember() { }
  member() { }
}
class ClassWithSymbolMembers {
  static [Member]() { }
  [Member]() { }
}

const MethodDescriptor = {
  value: expect.any(Function),
  writable: true,
  enumerable: false,
  configurable: true,
}

const Tests = {
  Object: {
    type: Object,
    isKnown: true,
    base: null,
    hierarchy: [ Object ],
  },
  Function: {
    type: Function,
    isKnown: true,
    base: Object,
    hierarchy: [ Function, Object ],
  },
  Empty: {
    type: Empty,
    base: Object,
    hierarchy: [ Empty, Object ],
  },
  EmptyExtendsObject: {
    type: EmptyExtendsObject,
    base: Object,
    hierarchy: [ EmptyExtendsObject, Object ],
  },
  EmptyExtendsNull: {
    type: EmptyExtendsNull,
    isAbstract: true,
    base: null,
    hierarchy: [ EmptyExtendsNull ],
  },
  ClassWithMembers: {
    type: ClassWithMembers,
    base: Object,
    hierarchy: [ ClassWithMembers, Object ],
    static: {
      ownKeys: [ 'staticMember' ],
      keys: [ 'staticMember' ],
      hosts: { 'staticMember': [ ClassWithMembers ],}
    },
    instance: {
      ownKeys: [ 'member' ],
      keys: [ 'member' ],
      hosts: { 'member': [ ClassWithMembers ], }
    }
  },
  ClassWithSymbolMembers: {
    type: ClassWithSymbolMembers,
    base: Object,
    hierarchy: [ ClassWithSymbolMembers, Object ],
    static: {
      ownKeys: [ Member ],
      keys: [ Member ],
      hosts: { [Member]: [ ClassWithSymbolMembers ], }
    },
    instance: {
      ownKeys: [ Member ],
      keys: [ Member ],
      hosts: { [Member]: [ ClassWithSymbolMembers ], }
    }
  },
  ExtensionOfClassWithMembers: {
    type: ExtensionOfClassWithMembers,
    base: ClassWithMembers,
    hierarchy: [ ExtensionOfClassWithMembers, ClassWithMembers, Object ],
    static: {
      ownKeys: [ ],
      keys: [ 'staticMember' ],
      hosts: { 'staticMember': [ ExtensionOfClassWithMembers, ClassWithMembers ], }
    },
    instance: {
      ownKeys: [ ],
      keys: [ 'member' ],
      hosts: { 'member': [ ExtensionOfClassWithMembers, ClassWithMembers ], }
    }
  },
  OverrideOfClassWithMembers: {
    type: OverrideOfClassWithMembers,
    base: ClassWithMembers,
    hierarchy: [ OverrideOfClassWithMembers, ClassWithMembers, Object ],
    static: {
      ownKeys: [ 'staticMember' ],
      keys: [ 'staticMember' ],
      hosts: { 'staticMember': [ 
        OverrideOfClassWithMembers, ClassWithMembers ], }
    },
    instance: {
      ownKeys: [ 'member' ],
      keys: [ 'member' ],
      hosts: { 'member': [
        OverrideOfClassWithMembers, ClassWithMembers ], }
    }
  }
}

const Cases = Object.entries(Tests)
const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'constructor', 'length', 'name', 'prototype' ]

describe('UserReflect', () => {
  it('reports known types correctly', () => {
    const actual = [ ...UserReflect.knownTypes() ]
    expect(actual).toEqual(KnownTypes)
  })
  it('reports known instance keys correctly', () => {
    const actual = [ ...UserReflect.knownKeys() ]
    expect(actual).toEqual(KnownInstanceKeys)
  })
  it('reports known static keys correctly', () => {
    const actual = [ ...UserReflect.knownKeys({ isStatic: true }) ]
    expect(actual).toEqual(KnownStaticKeys)
  })
})
describe.each(Cases)('%s', (name, md) => {
  let type
  beforeEach(() => {
    type = md.type
  })
  it('has correct base', () => {
    const baseType = UserReflect.getBaseType(type)
    expect(baseType).toBe(md.base)
  })
  it('has correct hierarchy', () => {
    const hierarchy = UserReflect.hierarchy(type)
    const actual = [ ...hierarchy ]
    expect(actual).toEqual(md.hierarchy)
  })
  it('has correct base types', () => {
    const baseTypes = UserReflect.baseTypes(type)
    const actual = [ ...baseTypes ]
    expect(actual).toEqual(md.hierarchy.slice(1))
  })
  it('is extension of each base type', () => {
    for (const baseType of md.hierarchy.slice(1)) {
      const isExtensionOf = UserReflect.isExtensionOf(type, baseType)
      expect(isExtensionOf).toBe(true)
    }
  })
  it('reports isKnown correctly', () => {
    const expected = !!md.isKnown
    const actual = UserReflect.isKnown(type)
    expect(actual).toBe(expected)
  })
  it('reports isAbstract correctly', () => {
    const expected = !!md.isAbstract
    const actual = UserReflect.isAbstract(type)
    expect(actual).toBe(expected)
  })
  it('reports no own known keys', () => {
    for (const key of UserReflect.knownKeys()) {
      const hasOwnKey = UserReflect.hasOwnKey(type, key)
      expect(hasOwnKey).toBe(false)
    }
  })
  describe.each(['static', 'instance'])('%s', (key) => {
    const isStatic = key == 'static'
    const expectedOwnKeys = md[key]?.ownKeys || []
    const expectedKeys = md[key]?.keys || []
    const expectedHosts = md[key]?.hosts || {}
    it('reports own keys correctly', () => {
      const ownKeys = UserReflect.ownKeys(type, { isStatic })
      const actual = [ ...ownKeys ]
      expect(actual).toEqual(expectedOwnKeys)
    })
    it('reports keys correctly', () => {
      const keys = UserReflect.keys(type, { isStatic })
      const actual = [ ...keys ]
        .filter(o => typeof o != 'function')
      expect(actual).toEqual(expectedKeys)
    })
    it('reports is host to all keys', () => {
      for (const key of expectedKeys) {
        const isHostOf = UserReflect.isHostOf(type, key, { isStatic })
        expect(isHostOf).toBe(true)
      }
    })
    it('reports not hosting known keys', () => {
      for (const key of UserReflect.knownKeys({ isStatic })) {
        const isHostOf = UserReflect.isHostOf(type, key, { isStatic })
        expect(isHostOf).toBe(false)
      }
    })
    it('reports correct hosts for keys', () => {
      for (const key of expectedKeys) {
        const hosts = UserReflect.getHosts(type, key, { isStatic })
        const actual = [ ...hosts ]
        expect(actual).toEqual(expectedHosts[key])
      }
    })
    it('reports correct descriptor for own keys', () => {
      for (const key of expectedOwnKeys) {
        const descriptor = UserReflect.getOwnDescriptor(type, key, { isStatic })
        expect(descriptor).toEqual(MethodDescriptor)
      }
    })
    it('reports correct own descriptors for own keys', () => {
      const ownDescriptors = UserReflect.ownDescriptors(type, { isStatic })
      const actual = [ ...ownDescriptors ]
      const expected = expectedOwnKeys
        .map(key => [ key, MethodDescriptor ])
        .flat()
      expect(actual).toEqual(expected)
    })
    it('reports correct descriptor for keys', () => {
      for (const key of expectedKeys) {
        const descriptor = 
          [...UserReflect.getDescriptor(type, key, { isStatic })]
            .filter(o => typeof o == 'object')[0]
        expect(descriptor).toEqual(MethodDescriptor)
      }
    })
    it('reports correct descriptors for keys', () => {
      const descriptors = UserReflect.descriptors(type, { isStatic })
      const actual = [ ...descriptors ]
        .filter(o => typeof o != 'function')
      const expected = expectedKeys
        .map(key => [ key, MethodDescriptor ])
        .flat()
      expect(actual).toEqual(expected)
    })
  })
})