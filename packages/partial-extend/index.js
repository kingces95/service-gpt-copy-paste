import { assert } from '@kingjs/assert'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { Thunk } from '@kingjs/partial-type'
import { isAbstract } from '@kingjs/abstract'
import { PartialType } from '@kingjs/partial-type'

// Extend takes a targets type and a partial type and merges the 
// partial type into the target type.

// If the partial type extends other partial types, those are merged
// in first (depth first). 

// All merged partial types are associated with the target type 
// (PartialAssociate.getPartialObjects).

// Existing members on the target type are not overwritten unless they
// are abstract (i.e. are implemented as @kingjs/abstract).

// A member of a partial type that is copied to the target is associated 
// with the partial type that defined it (PartialAssociate.hosts and
// PartialAssociate.getImplementingHost to get the host of the last member copied).  

// A member of a parital type that is copied to the target or was 
// considered for copying to the target (i.e. was abstract) is associated 
// with each partial type in the hierarchy that tried to defined it 
// (PartialAssociate.hosts). 

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Extensions. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it.

export function extend(type, partialType) {
  partialType = PartialLoader.load(partialType)

  const createThunk = (ownKey, descriptor) => Thunk in type 
    ? type[Thunk](ownKey, descriptor) 
    : descriptor

  define(type, partialType, { createThunk })
  associate(type, partialType)
}

function associate(type, partialType) {
  if (PartialLoader.transparent(partialType)) return

  PartialAssociate.addPartialType(type, partialType)
  for (const current of PartialReflect.baseTypes(partialType)) {
    assert(PartialReflect.isExtensionOf(
      partialType, PartialType, { minDepth: 2 }))
    PartialAssociate.addPartialType(type, current)
  }
}

function defineProperty(type, key, descriptor) {
  const prototype = type.prototype

  if (key in prototype && isAbstract(descriptor)) return false

  Object.defineProperty(prototype, key, descriptor)
  return true
}

function define(type, partialType, { createThunk }) {
  let key
  for (const current of PartialReflect.descriptors(partialType)) {
    assert (typeof current == 'string' 
      || typeof current == 'symbol'
      || typeof current == 'object'
      || typeof current == 'function',
      `Unexpected type: ${typeof current}`)

    switch (typeof current) {
      case 'string':
      case 'symbol':
        key = current
        break
      case 'object':
        const descriptor = current
        const thunk = createThunk(key, descriptor)
        defineProperty(type, key, thunk)
        break
      case 'function':
        break
    }
  }
}

// describe('with a method', () => {
//   let method
//   let methodResult
//   beforeEach(() => {
//     method = function method() { }
//     methodResult = 
//       PartialTypeReflect.defineProperty(type, 'method', { value: method })
//   })

//   it('should return method as own descriptor', () => {
//     const descriptor = 
//       Es6UserReflect.getOwnDescriptor(type, 'method')
//     expect(descriptor.value).toBe(method)
//     expect(methodResult).toBe(true)
//   })

//   describe('after attempting to define as abstract method', () => {
//     let abstractResult
//     beforeEach(() => {
//       abstractResult = 
//         PartialTypeReflect.defineProperty(type, 'method', { value: abstract })
//     })

//     it('should not change the method', () => {
//       expect(type.prototype.method).toBe(method)
//       expect(abstractResult).toBe(false)
//     })
//   })
// })