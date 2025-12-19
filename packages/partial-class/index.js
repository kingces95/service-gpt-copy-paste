import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { isPojo } from '@kingjs/pojo-test'
import { MemberCollection } from '@kingjs/member-collection'

const {
  isExtensionOf,
  ownMemberKeys,
} = Reflection

export class PartialClass extends MemberCollection {

  static create(pojo) {
    assert(isPojo(pojo), 'expected a pojo')

    const [type] = [class extends PartialClass { }]
    const prototype = type.prototype

    for (const key of ownMemberKeys(pojo)) {
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    return type
  }

  static fromArg(arg) {
    if (isPojo(arg))
      arg = PartialClass.create(arg)

    assert(isExtensionOf(arg, MemberCollection),
      `Expected arg to be a MemberCollection.`)

    return arg
  }
}
