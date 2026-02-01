import { assert } from '@kingjs/assert'
import { Associate } from '@kingjs/associate'
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject, PartialObjectReflect } from '@kingjs/partial-object'
import { UserReflect } from '@kingjs/user-reflect'
import { Define } from '@kingjs/define'
import { PartialAssociate } from '@kingjs/partial-associate'

// Operations supporting PartialLoader.merge. Merge takes a targeg type
// and a partial type and merges the partial type into the target type.

export class PartialLoader {

  static *ownPartialObjects(type) {
    assert(PartialObjectReflect.isPartialObject(type))
    yield* Associate.ownTypes(type, PartialObject.OwnCollectionSymbols)
  }

  static getOwnDescriptor(type, key) {
    assert(PartialObjectReflect.isPartialObject(type))
    const descriptor = UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null
    return type[PartialObject.Compile](descriptor) 
  }

  static *ownDescriptors(type) {
    assert(PartialObjectReflect.isPartialObject(type))
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

    assert(!PartialObjectReflect.isPartialObject(type),
      `Expected type to not be a PartialObject.`)
    assert(PartialObjectReflect.isPartialObject(partialType),
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
