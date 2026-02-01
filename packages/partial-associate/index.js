import { assert } from '@kingjs/assert'
import { Es6Associate } from '@kingjs/es6-associate'
import { PartialTypeReflect } from '@kingjs/partial-type'

const PartialExtensions = Symbol.for('PartialReflect.PartialExtensions')
const HostMap = Symbol.for('PartialReflect.HostMap')
const HostLookup = Symbol.for('PartialReflect.HostLookup')

export class PartialAssociate {

  static addPartialExtension(type, partialType) {
    assert(!PartialTypeReflect.isKnown(type))
    assert(PartialTypeReflect.isPartialType(partialType))
    Es6Associate.addAssociates(type, PartialExtensions, partialType)
  }
  static *ownPartialExtensions(type) {
    yield *Es6Associate.assembleOwnAssociates(
      type, { [PartialExtensions]: { } })
  }
  static *partialExtensions(type) {
    yield *Es6Associate.assembleAssociates(
      type, { [PartialExtensions]: { } })
  }

  static addHost(type, key, host, { isStatic } = { }) {
    assert(!PartialTypeReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociate(
      type, key, HostMap, host, { isStatic })
  }
  static getHost(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic }))
      return null

    if (key in (isStatic ? type : type.prototype) === false) return null

    const associate = Es6Associate.getMemberAssociate(
      type, key, HostMap)

    return associate || type
  }

  static addHosts(type, key, hosts, { isStatic } = { }) {
    assert(!PartialTypeReflect.isKnownKey(type, key, { isStatic }))
    Es6Associate.addMemberAssociates(
      type, key, HostLookup, hosts, { isStatic })
  }
  static *hosts(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnownKey(type, key, { isStatic })) return

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