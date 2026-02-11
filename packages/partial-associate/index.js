import { assert } from '@kingjs/assert'
import { Es6Associate } from '@kingjs/es6-associate'
import { PartialTypeReflect } from '@kingjs/partial-type'

const PartialTypes = Symbol.for('PartialReflect.partialTypes')
const HostMap = Symbol.for('PartialReflect.hostMap')
const AbstractHostLookup = Symbol.for('PartialReflect.abstractHostLookup')
const HostLookup = Symbol.for('PartialReflect.hostLookup')

// PartialAssociate is like Es6Associate but filters out types known
// to the PartialType system and restricts associates to just those
// used by the PartialType system (e.g. PartialTypes, HostMap, 
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
  static *partialExtensions(type) {
    yield* Es6Associate.associates(type, PartialTypes)
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
    Es6Associate.addMemberAssociates(type, key, AbstractHostLookup, host, { isStatic })
  }
  static *abstractHosts(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    yield* Es6Associate.memberAssociates(type, key, AbstractHostLookup, { isStatic })
  }

  static addHost$(type, key, hosts, { isStatic } = { }) {
    assert(!PartialTypeReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociates(type, key, HostLookup, hosts, { isStatic })
  }
  static *hosts$(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return
    yield* Es6Associate.memberAssociates(type, key, HostLookup, { isStatic })
  }
}