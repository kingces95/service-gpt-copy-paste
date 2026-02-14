import { assert } from '@kingjs/assert'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialTypeReflect, Thunk } from '@kingjs/partial-type'
import { PartialAssociate } from '@kingjs/partial-associate'
import { Define } from '@kingjs/define'
import { Extensions } from '@kingjs/extensions'

// Extend takes a targets type and a partial type and merges the 
// partial type into the target type.

// If the partial type extends other partial types, those are merged
// in first (depth first). 

// All merged partial types are associated with the target type 
// (PartialAssociate.getPartialObjects).

// Existing members on the target type are not overwritten unless they
// are abstract (i.e. are implemented as @kingjs/abstract).

// A member of a partial type that is copied to the target is associated 
// with the partial type that defined it (PartialAssociate.getHosts and
// PartialAssociate.getFinalHost to get the host of the last member copied).  

// A member of a parital type that is copied to the target or was 
// considered for copying to the target (i.e. was abstract) is associated 
// with each partial type in the hierarchy that tried to defined it 
// (PartialAssociate.getHosts). 

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Extensions. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it (parentType).

export function extend(type, partialType, { 
    parentType = type, 
    isTransparent = partialType?.prototype instanceof Extensions,
  } = { }) {
  partialType = PartialLoader.load(partialType)

  assert(!PartialTypeReflect.isKnown(type),
    `Expected type to not be a known type.`)
  // assert(!PartialTypeReflect.isPartialType(type),
  //   `Expected type to not be a PartialType.`)
  assert(PartialTypeReflect.isPartialType(partialType),
    `Expected partialType to indirectly extend PartialType.`)

  const keys = new Set()

  for (const extension of PartialLoader.ownPartialTypes(partialType)) {
    const extensionKeys = extend(type, extension, { 
      parentType: partialType,
      isTransparent: extension.prototype instanceof Extensions,
    })

    for (const key of extensionKeys) keys.add(key)
  }

  if (!isTransparent) 
    PartialAssociate.addPartialType(type, partialType)

  const hostType = isTransparent ? parentType : partialType

  let ownKey
  for (const current of PartialLoader.ownDescriptors(partialType)) {
    switch (typeof current) {
      case 'string':
      case 'symbol': 
        ownKey = current
        keys.add(ownKey)
        break
      case 'object': 
        let descriptor = current
        if (Thunk in type)
          descriptor = type[Thunk](ownKey, current)

        if (!Define.property(type, ownKey, descriptor)) continue
        PartialAssociate.setFinalHost(type, ownKey, hostType)
        break
      default: assert(false, `Unexpected type: ${typeof current}`)
    }
  }

  for (const key of keys) PartialAssociate.addHost(type, key, hostType)
  return keys
}
