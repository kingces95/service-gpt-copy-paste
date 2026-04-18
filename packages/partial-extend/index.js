import { assert } from '@kingjs/assert'
import { PartialReflect } from '@kingjs/partial-reflect'
import { CreateThunk } from '@kingjs/partial-proxy'
import { isAbstract } from '@kingjs/abstract'
import { isPojo } from '@kingjs/pojo-test'
import { PartialTypes } from '@kingjs/partial-symbols'
import { Transparent } from '@kingjs/partial-symbols'

// Extend takes copies (merges) descriptors found on a partial type
// on to a targets type.

// If the partial type extends other partial types, logically, those 
// are merged in first. Members on the target type are not 
// overwritten unless they are abstract (i.e. are implemented as 
// @kingjs/abstract).

// All merged partial types are associated with the target type 
// (PartialLoader.addPartialType).

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Extensions. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it.

export function extend(type, partialType) {
  assert(!isPojo(type))
  
  const prototype = type.prototype
  return PartialReflect.copyTo(partialType, prototype, {
    createThunk: (key, descriptor) => CreateThunk in type 
      ? type[CreateThunk](key, descriptor) 
      : descriptor,

    predicate: (key, descriptor) =>
      !(key in prototype && isAbstract(descriptor)),

    onHost: (partialType) => {
      if (partialType[Transparent]) return
      if (!type[PartialTypes]) type[PartialTypes] = new Set()
      type[PartialTypes].delete(partialType) // preserve order
      type[PartialTypes].add(partialType)
    }
  })
}

