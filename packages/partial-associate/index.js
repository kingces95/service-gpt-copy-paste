import { assert } from '@kingjs/assert'
import { Es6Associate } from '@kingjs/es6-associate'
import { PartialTypeReflect } from '@kingjs/partial-type'

const PartialExtensions = Symbol.for('PartialReflect.PartialExtensions')
const HostMap = Symbol.for('PartialReflect.HostMap')
const HostLookup = Symbol.for('PartialReflect.HostLookup')

// PartialAssociate is like Es6Associate but filters out types known
// to the PartialType system and restricts associates to just those
// used by the PartialType system (e.g. PartialExtensions, HostMap, 
// and HostLookup). 

// PartialAssociate is internal. PartialAssociate is used by several 
// partial packages to expose via PartialReflect the final semanitc 
// for partial extensions, abstract hosts, and hosts.

export class PartialAssociate {

  static addPartialExtension(type, partialType) {
    assert(!PartialTypeReflect.isKnown(type))
    assert(PartialTypeReflect.isPartialType(partialType))
    Es6Associate.addAssociates(type, PartialExtensions, partialType)
  }
  static *ownPartialExtensions(type) {
    yield* Es6Associate.ownAssociates(type, PartialExtensions)
  }
  static *partialExtensions(type) {
    yield* Es6Associate.associates(type, PartialExtensions)
  }

  static addHost(type, key, host, { isStatic } = { }) {
    assert(!PartialTypeReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociate(type, key, HostMap, host, { isStatic })
  }
  static getHost(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return null
    return Es6Associate.getMemberAssociate(type, key, HostMap, { isStatic })
  }

  static addAbstractHost(type, key, host, { isStatic } = { }) {
    assert(!PartialTypeReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociates(type, key, HostLookup, host, { isStatic })
  }
  static *abstractHosts(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    yield* Es6Associate.memberAssociates(type, key, HostLookup, { isStatic })
  }
}