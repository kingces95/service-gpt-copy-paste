import { assert } from '@kingjs/assert'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialTypeReflect, Thunk } from '@kingjs/partial-type'
import { PartialAssociate } from '@kingjs/partial-associate'
import { Define } from '@kingjs/define'
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
// with the partial type that defined it (PartialAssociate.getHosts and
// PartialAssociate.getFinalHost to get the host of the last member copied).  

// A member of a parital type that is copied to the target or was 
// considered for copying to the target (i.e. was abstract) is associated 
// with each partial type in the hierarchy that tried to defined it 
// (PartialAssociate.getHosts). 

// Transparent partial types are merged but not associated. A transparent
// partial type is one whose prototype extends Extensions. Members of
// a transparent partial type are logically considered to be defined by 
// the partial type that "extended" it.

export function extend(type, partialType) {
  partialType = PartialLoader.load(partialType)

  const createThunk = (ownKey, descriptor) => Thunk in type 
    ? type[Thunk](ownKey, descriptor) 
    : descriptor

  const plan = PartialLoader.getExtendPlan(partialType)

  for (let { host, keys, ownKeys, descriptors } of plan) {
    if (host) {
      PartialAssociate.addPartialType(type, host)

      for (const key of keys) 
        PartialAssociate.addHost(type, key, host)

      for (const key of ownKeys) 
        PartialAssociate.addOwnHost(type, key, host)
    }

    for (const [key, descriptor] of descriptors) {
      const thunk = createThunk(key, descriptor)
      Define.property(type, key, thunk)
      if (host && !isAbstract(descriptor))
        PartialAssociate.setFinalHost(type, key, host)
    }
  }
}
