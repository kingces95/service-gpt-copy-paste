import { assert } from '@kingjs/assert'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialTypeReflect } from '@kingjs/partial-type'
import { PartialAssociate } from '@kingjs/partial-associate'
import { Define } from '@kingjs/define'
import { Extensions } from '@kingjs/extensions'
import { PartialProxyReflect, Compile } from '@kingjs/partial-proxy'
import { Descriptor } from '@kingjs/descriptor'
import { isAbstract } from '@kingjs/abstract'

// Extend takes a targets type and a partial type and merges the 
// partial type into the target type.

// If the partial type extends other partial types, those are merged
// in first (depth first). 

// All merged partial types are associated with the target type 
// (PartialAssociate.getPartialObjects).

// Existing members on the target type are not overwritten unless they
// are abstract (i.e. are implemented as @kingjs/abstract).

// A member of a partial type that is copied to the target is associated 
// with the partial type that defined it (PartialAssociate.getHost). 

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
    isTransparent = partialType?.prototype instanceof Extensions
  } = { }) {

  partialType = PartialLoader.load(partialType)

  assert(!PartialTypeReflect.isKnown(type),
    `Expected type to not be a known type.`)
  assert(!PartialTypeReflect.isPartialType(type),
    `Expected type to not be a PartialType.`)
  assert(PartialTypeReflect.isPartialType(partialType),
    `Expected partialType to indirectly extend PartialType.`)

  for (const extension of PartialLoader.ownPartialExtensions(partialType)) {
    extend(type, extension, { 
      parentType: partialType,
      isTransparent: extension.prototype instanceof Extensions
    })
  }

  if (!isTransparent) 
    PartialAssociate.addPartialExtension(type, partialType)

  let key
  for (const current of PartialLoader.ownDescriptors(partialType)) {
    switch (typeof current) {
      case 'string':
      case 'symbol': key = current; break
      case 'object': 
        const hostType = isTransparent ? parentType : partialType
        if (isAbstract(current))
          PartialAssociate.addAbstractHost(type, key, hostType)

        const descriptor = PartialProxyReflect.isPartialProxy(type)
          ? type[Compile](type, key, current) : current
        if (!Define.property(type, key, descriptor)) continue
        PartialAssociate.addHost(type, key, hostType)
        break
      default: assert(false, `Unexpected type: ${typeof current}`)
    }
  }
}
