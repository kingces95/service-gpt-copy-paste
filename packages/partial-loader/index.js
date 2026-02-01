import { assert } from '@kingjs/assert'
import { Associate } from '@kingjs/associate'
import { UserReflect } from '@kingjs/user-reflect'
import { Define } from '@kingjs/define'
import { PartialPojo } from '@kingjs/partial-pojo'
import { 
  PartialType, 
  PartialTypeReflect 
} from '@kingjs/partial-type'

// Operations supporting @kingjs/extend.

export class PartialLoader {

  static load(pojoOrType) {
    const type = Define.type(pojoOrType, PartialPojo)
    assert(PartialTypeReflect.isPartialType(type))
    return type
  }

  static *ownPartialExtensions(type) {
    assert(PartialTypeReflect.isPartialType(type))
    yield* Associate.ownTypes(type, PartialType.OwnCollectionSymbols)
  }

  static getOwnDescriptor(type, key) {
    assert(PartialTypeReflect.isPartialType(type))
    const descriptor = UserReflect.getOwnDescriptor(type, key)
    if (!descriptor) return null
    return type[PartialType.Compile](descriptor) 
  }

  static *ownDescriptors(type) {
    assert(PartialTypeReflect.isPartialType(type))
    for (const key of UserReflect.ownKeys(type)) {
      const descriptor = PartialLoader.getOwnDescriptor(type, key)
      yield key
      yield descriptor
    }
  }
}
