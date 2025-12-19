import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { isPojo } from '@kingjs/pojo-test'
import { PartialObject } from '@kingjs/partial-object'

const {
  isExtensionOf,
  ownMemberKeys,
} = Reflection

export class TransparentPartialClass extends PartialObject {

  static create(pojo) {
    assert(isPojo(pojo), 'expected a pojo')

    const [type] = [class extends TransparentPartialClass { }]
    const prototype = type.prototype

    for (const key of ownMemberKeys(pojo)) {
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    return type
  }

  static fromArg(arg) {
    if (isPojo(arg))
      arg = TransparentPartialClass.create(arg)

    assert(isExtensionOf(arg, PartialObject),
      `Expected arg to be a PartialObject.`)

    return arg
  }
}
