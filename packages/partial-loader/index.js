import { assert } from '@kingjs/assert'
import { Associate } from '@kingjs/associate'
import { UserReflect } from '@kingjs/user-reflect'
import { Define } from '@kingjs/define'
import { PartialPojo } from '@kingjs/partial-pojo'
import { 
  PartialObject, 
  PartialObjectReflect 
} from '@kingjs/partial-object'

// Operations supporting @kingjs/extend.

export class PartialLoader {

  static load(pojoOrType) {
    const type = Define.type(pojoOrType, PartialPojo)
    assert(PartialObjectReflect.isPartialObject(type))
    return type
  }

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
}
