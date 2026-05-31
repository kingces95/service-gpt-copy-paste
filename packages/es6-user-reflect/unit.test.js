import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'

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
    component: null,
    composition: [ Object ],
  },
  Function: {
    type: Function,
    isKnown: true,
    component: Object,
    composition: [ Function, Object ],
  },
  Empty: {
    type: Empty,
    component: Object,
    composition: [ Empty, Object ],
  },
  EmptyExtendsObject: {
    type: EmptyExtendsObject,
    component: Object,
    composition: [ EmptyExtendsObject, Object ],
  },
  EmptyExtendsNull: {
    type: EmptyExtendsNull,
    isAbstract: true,
    component: null,
    composition: [ EmptyExtendsNull ],
  },
  ClassWithMembers: {
    type: ClassWithMembers,
    component: Object,
    composition: [ ClassWithMembers, Object ],
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
    component: Object,
    composition: [ ClassWithSymbolMembers, Object ],
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
    component: ClassWithMembers,
    composition: [ ExtensionOfClassWithMembers, ClassWithMembers, Object ],
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
    component: ClassWithMembers,
    composition: [ OverrideOfClassWithMembers, ClassWithMembers, Object ],
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
const KnownStaticKeys = [ 'length', 'name', 'prototype', 'constructor' ]

describe.each(Cases)('%s', (name, md) => {
  let type
  beforeEach(() => {
    type = md.type
  })
  it('has correct component', () => {
    const componentType = Es6UserReflect.getComponent(type)
    expect(componentType).toBe(md.component)
  })
  it('has correct composition', () => {
    const composition = Es6UserReflect.composition(type)
    const actual = [ ...composition ]
    expect(actual).toEqual(md.composition)
  })
  it('has correct components', () => {
    const components = Es6UserReflect.components(type)
    const actual = [ ...components ]
    expect(actual).toEqual(md.composition.slice(1))
  })
  it('is extension of each component', () => {
    for (const componentType of md.composition.slice(1)) {
      const isExtensionOf = Es6UserReflect.isExtensionOf(type, componentType)
      expect(isExtensionOf).toBe(true)
    }
  })
  it('reports isKnown correctly', () => {
    const expected = !!md.isKnown
    const actual = Es6UserReflect.isKnown(type)
    expect(actual).toBe(expected)
  })
  it('reports isAbstract correctly', () => {
    const expected = !!md.isAbstract
    const actual = Es6UserReflect.isAbstract(type)
    expect(actual).toBe(expected)
  })
  describe.each(['static', 'instance'])('%s', (key) => {
    const isStatic = key == 'static'
    const expectedOwnKeys = md[key]?.ownKeys || []
    const expectedKeys = md[key]?.keys || []
    const expectedHosts = md[key]?.hosts || {}
    it('reports own keys correctly', () => {
      const ownKeys = Es6UserReflect.ownKeys(type, { isStatic })
      const actual = [ ...ownKeys ]
      expect(actual).toEqual(expectedOwnKeys)
    })
    it('reports keys correctly', () => {
      const keys = Es6UserReflect.keys(type, { isStatic })
      const actual = [ ...keys ]
        .filter(o => typeof o != 'function')
      expect(actual).toEqual(expectedKeys)
    })
    it('reports is host to all keys', () => {
      for (const key of expectedKeys) {
        const hasKey = Es6UserReflect.hasKey(type, key, { isStatic })
        expect(hasKey).toBe(true)
      }
    })
    it('reports correct descriptor for own keys', () => {
      for (const key of expectedOwnKeys) {
        const descriptor = Es6UserReflect.getOwnDescriptor(type, key, { isStatic })
        expect(descriptor).toEqual(MethodDescriptor)
      }
    })
    it('reports correct own descriptors for own keys', () => {
      const ownDescriptors = Es6UserReflect.ownDescriptors(type, { isStatic })
      const actual = [ ...ownDescriptors ]
      const expected = expectedOwnKeys
        .map(key => [ key, MethodDescriptor ])
        .flat()
      expect(actual).toEqual(expected)
    })
    it('reports correct descriptor for keys', () => {
      for (const key of expectedKeys) {
        const descriptor = 
          [...Es6UserReflect.findDescriptors(type, key, { isStatic })]
            .filter(o => typeof o == 'object')[0]
        expect(descriptor).toEqual(MethodDescriptor)
      }
    })
    it('reports correct descriptors for keys', () => {
      const descriptors = Es6UserReflect.descriptors(type, { isStatic })
      const actual = [ ...descriptors ]
        .filter(o => typeof o != 'function')
      const expected = expectedKeys
        .map(key => [ key, MethodDescriptor ])
        .flat()
      expect(actual).toEqual(expected)
    })
  })
})
