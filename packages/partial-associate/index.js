import { assert } from '@kingjs/assert'
import { Es6Associate } from '@kingjs/es6-associate'
import { PartialObjectReflect } from '@kingjs/partial-object'

const Declarations = Symbol.for('PartialReflect.Declarations')
const HostMap = Symbol.for('PartialReflect.HostMap')
const HostLookup = Symbol.for('PartialReflect.HostLookup')

export class PartialAssociate {

  static addPartialObject(type, partialObject) {
    assert(!PartialObjectReflect.isKnown(type))
    assert(PartialObjectReflect.isPartialObject(partialObject))
    Es6Associate.addAssociates(type, Declarations, partialObject)
  }
  static *ownPartialObjects(type) {
    yield *Es6Associate.assembleOwnAssociates(
      type, { [Declarations]: { } })
  }
  static *partialObjects(type) {
    yield *Es6Associate.assembleAssociates(
      type, { [Declarations]: { } })
  }

  static addHost(type, key, host, { isStatic } = { }) {
    assert(!PartialObjectReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociate(
      type, key, HostMap, host, { isStatic })
  }
  static getHost(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isKnownKey(type, key, { isStatic }))
      return null

    if (key in (isStatic ? type : type.prototype) === false) return null

    const associate = Es6Associate.getMemberAssociate(
      type, key, HostMap)

    return associate || type
  }

  static addHosts(type, key, hosts, { isStatic } = { }) {
    assert(!PartialObjectReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociates(
      type, key, HostLookup, hosts, { isStatic })
  }
  static *hosts(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isKnownKey(type, key, { isStatic })) return

    if (key in (isStatic ? type : type.prototype) === false) return null
    
    const result = Es6Associate.memberAssociates(
      type, key, HostLookup, { isStatic })

    const first = result.next()
    if (first.done)
      // todo: this type is wrong; coult be a base type 
      return yield type

    yield first.value
    yield* result
  }
}