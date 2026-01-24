import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { UserReflect } from '@kingjs/user-reflect'

const ObjectMd = {
  name: 'Object',
  type: Object,
}

const FunctionMd = {
  name: 'Function',
  type: Function,
  base: Object,
}

const ClassMd = {
  name: 'Class',
  type: class MyClass { 
    static staticMember() { } 
    member() { } 
  },
  base: Object,
  ownMembers: [ 'member' ],
  members: [ 'member' ],
  staticOwnMembers: [ 'staticMember' ],
  staticMembers: [ 'staticMember' ],
}

const ExtendedClassMd = {
  name: 'ExtendedClass',
  type: class MyExtendedClass extends ClassMd.type { 
    static extendedStaticMember() { }
    extendedMember() { }
  },
  base: ClassMd.fn,
  ownMembers: [ 'extendedMember' ],
  members: [ 'extendedMember', 'member' ],
  staticOwnMembers: [ 'extendedStaticMember' ],
  staticMembers: [ 'extendedStaticMember', 'staticMember' ],
}

const Md = [
  [ObjectMd.name, ObjectMd],
  [FunctionMd.name, FunctionMd],
  [ClassMd.name, ClassMd],
  [ExtendedClassMd.name, ExtendedClassMd]
]

describe.each(Md)('A type %s', (name, md) => {
  let type
  beforeEach(() => {
    type = md.type
  })
  it('should have expected own descriptor', () => {
    for (const key in md.ownMembers || []) {
      const descriptor = UserReflect.getOwnDescriptor(type, key)
      expect(descriptor).toBeDefined()
    }
  })
  // it('should have expected own descriptors', () => {
  //   const actual = [...UserReflect.ownDescriptors(
  //     type, { includeContext: true })]
  //   const expected = (md.ownMembers || [])
  // })
})