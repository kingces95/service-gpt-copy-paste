import { assert } from '@kingjs/assert'
import { Es6Associate } from '@kingjs/es6-associate'
import { PartialTypeReflect } from '@kingjs/partial-type'

const PartialTypes = Symbol.for('PartialAssociate.partialTypes')

// PartialAssociate is like Es6Associate but filters out types known
// to the PartialType system and restricts associates to just those
// used by the PartialType system (e.g. PartialTypes, FinalHostMap, 
// and HostLookup). 

// PartialAssociate is internal. PartialAssociate is used by several 
// partial packages to expose via PartialReflect the final semanitc 
// for partial extensions, abstract hosts, and hosts.

export class PartialAssociate {

  static addPartialType(type, partialType) {
    assert(!PartialTypeReflect.isKnown(type))
    assert(PartialTypeReflect.isPartialType(partialType))
    Es6Associate.addAssociates(type, PartialTypes, partialType)
  }
  static *ownPartialTypes(type) {
    yield* Es6Associate.ownAssociates(type, PartialTypes)
  }
  static *partialTypes(type) {
    yield* Es6Associate.associates(type, PartialTypes)
  }
}