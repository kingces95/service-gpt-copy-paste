import { assert } from '@kingjs/assert'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialObjectReflect } from '@kingjs/partial-object'
import { PartialAssociate } from '@kingjs/partial-associate'
import { Define } from '@kingjs/define'
import { PartialPojo } from '@kingjs/partial-pojo'

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
// partial type is one whose prototype extends PartialPojo. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it (parentType).

export function extend(type, partialType, { 
    parentType = type, 
    isTransparent = partialType?.prototype instanceof PartialPojo
  } = { }) {

    partialType = PartialLoader.load(partialType)

    assert(!PartialObjectReflect.isKnown(type),
      `Expected type to not be a known type.`)
    assert(!PartialObjectReflect.isPartialObject(type),
      `Expected type to not be a PartialObject.`)
    assert(PartialObjectReflect.isPartialObject(partialType),
      `Expected partialObject to indirectly extend PartialObject.`)

    for (const baseType of PartialLoader.ownPartialObjects(partialType)) {
      extend(type, baseType, { 
        parentType: partialType,
        isTransparent: baseType.prototype instanceof PartialPojo
      })
    }

    if (!isTransparent) 
      PartialAssociate.addPartialObject(type, partialType)

    let key
    for (const current of PartialLoader.ownDescriptors(partialType)) {
      switch (typeof current) {
        case 'string':
        case 'symbol': key = current; break
        case 'object': 
          const descriptor = current
          const defined = Define.property(type, key, descriptor)
          const hostType = isTransparent ? parentType : partialType

          PartialAssociate.addHosts(type, key, hostType)
          if (!defined) continue
          PartialAssociate.addHost(type, key, hostType)
          break
        default: assert(false, `Unexpected type: ${typeof current}`)
      }
    }
  }