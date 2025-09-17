import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { asArray } from '@kingjs/as-array'
import { Extension, Extensions } from '@kingjs/extension'
import { Reflection } from '@kingjs/reflection'

const {
  isExtensionOf
} = Reflection

export const Parts = Symbol('PartialClassParts')
export function getParts(type) {

  // if pojo, create anonymous partial class from pojo
  const parts = asArray(type[Parts]).map(part => isPojo(part) ? 
    PartialClass.fromPojo(part) : part)

  parts.forEach(part => assert(isExtensionOf(part, PartialClass),
    `Parts must be PartialClass extensions.`))

  return parts
}

export class PartialClass extends Extension {

  static get [Extensions]() { return getParts(this) }

  static fromPojo(pojo) {
    return Extension.fromPojo$(pojo, PartialClass)
  }
}
