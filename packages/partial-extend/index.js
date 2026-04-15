import { assert } from '@kingjs/assert'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialAssociate } from '@kingjs/partial-associate'
import { Thunk } from '@kingjs/partial-proxy'
import { isAbstract } from '@kingjs/abstract'
import { PartialType } from '@kingjs/partial-type'

// Extend takes copies (merges) descriptors found on a partial type
// on to a targets type.

// If the partial type extends other partial types, logically, those 
// are merged in first. Members on the target type are not 
// overwritten unless they are abstract (i.e. are implemented as 
// @kingjs/abstract).

// All merged partial types are associated with the target type 
// (PartialAssociate.getPartialObjects).

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Extensions. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it.

export function extend(type, partialType) {
  partialType = PartialLoader.load(partialType)

  const createThunk = (ownKey, descriptor) => Thunk in type 
    ? type[Thunk](ownKey, descriptor) 
    : descriptor

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
        const prototype = type.prototype
        if (key in prototype && isAbstract(descriptor)) break

        const thunk = createThunk(key, descriptor)
        Object.defineProperty(prototype, key, thunk)
        break
      case 'function':
        break
    }
  }
  
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

