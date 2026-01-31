import { assert } from '@kingjs/assert'
import { Associate } from '@kingjs/associate'
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject, PartialObjectReflect } from '@kingjs/partial-object'
import { UserReflect } from '@kingjs/user-reflect'
import { Define } from '@kingjs/define'
import { PartialAssociate } from '@kingjs/partial-associate'
// import { Es6Reflect } from '@kingjs/es6-reflect'

// Operations supporting PartialLoader.merge. Merge takes a targeg type
// and a partial type and merges the partial type into the target type.

export class PartialLoader {
  static isKnown(type) {
    return PartialObjectReflect.isKnown(type)
  }
  static isPartialObject(type) {
    return PartialObjectReflect.isPartialObject(type)
  }
  static getPartialObjectType(type) {
    return PartialObjectReflect.getPartialObjectType(type)
  }

  static *ownPartialObjects(type) {
    assert(PartialLoader.isPartialObject(type))
    yield* Associate.ownTypes(type, PartialObject.OwnCollectionSymbols)
  }

  static getOwnDescriptor(type, key) {
    assert(PartialLoader.isPartialObject(type))
    const descriptor = UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null
    return type[PartialObject.Compile](descriptor) 
  }
  static *ownDescriptors(type) {
    assert(PartialLoader.isPartialObject(type))
    for (const key of UserReflect.ownKeys(type)) {
      const descriptor = PartialLoader.getOwnDescriptor(type, key)
      yield key
      yield descriptor
    }
  }

  static merge(type, partialType, { 
    parentType = type, 
    isTransparent = partialType?.prototype instanceof PartialPojo
  } = { }) {

    assert(!PartialLoader.isKnown(type),
      `Expected type to not be a known type.`)
    assert(!PartialLoader.isPartialObject(type),
      `Expected type to not be a PartialObject.`)
    assert(PartialLoader.isPartialObject(partialType),
      `Expected partialObject to indirectly extend PartialObject.`)

    for (const baseType of PartialLoader.ownPartialObjects(partialType)) {
      PartialLoader.merge(type, baseType, { 
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
}
