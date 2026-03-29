import { PartialLoader } from '@kingjs/partial-loader'
import { Thunk } from '@kingjs/partial-type'

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

  const plan = PartialLoader.getPlan(partialType)
  PartialLoader.define(type, partialType, { createThunk })
  PartialLoader.associate(type, plan)
}
