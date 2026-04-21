import { assert } from '@kingjs/assert'
import { 
  PartialReflect, 
  isFirstOrOverride,
  publishExtensions
} from '@kingjs/partial-reflect'
import { CreateThunk } from '@kingjs/partial-proxy'
import { isPojo } from '@kingjs/pojo-test'
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
// partial type is one whose prototype extends Attachments. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it.

export function extend(type, partialType) {
  assert(!isPojo(type))
  
  const hosts = new Set()
  const prototype = type.prototype
  PartialReflect.copyTo(partialType, prototype, {
    createThunk: (key, descriptor) => CreateThunk in type 
      ? type[CreateThunk](key, descriptor) 
      : descriptor,

    filter: (host, key, descriptor) =>
      isFirstOrOverride(descriptor, key in prototype),

    onHost: (host) => hosts.add(host),
  })

  if (!partialType[Transparent]) {
    const mergeOrder = [...hosts].reverse()
    publishExtensions(type, ...mergeOrder)
  }
}
