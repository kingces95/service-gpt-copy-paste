import { assert } from '@kingjs/assert'
import { PartialType } from '@kingjs/partial-type'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { Postcondition } from '@kingjs/partial-symbols'

const toString = Object.prototype.toString

export class Shape extends PartialType {
  // The default instanceof behavior would always be false because
  // Shape is an abstract type in that Shape is a pure metadata
  // construct so should never be instantiated so no instance would
  // ever exist. This fact justifies overriding Symbol.hasInstance
  // to provide an alternative behavior which is to test if an instance
  // satisfies a shape.
  //
  // A shape is satisfied if:
  //
  //   (1) the instance satisfies any static whole-value constraints
  //       such as typeof, tag, prototype, or constructability
  //   (2) the instance can be duck cast to the shape.

  static [Symbol.hasInstance](instance) {
    if (this == Shape)
      return false

    // assert directly extends shape
    assert(Object.getPrototypeOf(this) === Shape,
      `Shape "${this.name}" must directly extend Shape.`)

    if (instance == null)
      return false

    if (!Shape.#testTypeof(this, instance))
      return false

    if (!Shape.#testTag(this, instance))
      return false

    if (!Shape.#testPrototype(this, instance))
      return false

    if (!Shape.#testProtoPrototype(this, instance))
      return false

    return Es6UserReflect.canDuckCast(this, Object(instance))
  }

  static #testTypeof(shape, instance) {
    if (!('typeof' in shape))
      return true

    return typeof instance == shape.typeof
  }

  static #testProtoPrototype(shape, instance) {
    if (!('protoPrototype' in shape))
      return true

    const descriptor = Object.getOwnPropertyDescriptor(instance, 'prototype')
    if (!descriptor)
      return false

    const prototype = descriptor.value
    if (prototype == null)
      return false

    if (typeof prototype != 'object')
      return false

    if (prototype.constructor != instance)
      return false

    const protoPrototype = shape.protoPrototype

    if (descriptor.enumerable != protoPrototype.enumerable)
      return false

    if ('writable' in protoPrototype &&
      descriptor.writable != protoPrototype.writable)
      return false

    if (descriptor.configurable != protoPrototype.configurable)
      return false

    return true
  }

  static #testTag(shape, instance) {
    const expectedTag = shape.tag
    if (expectedTag === undefined)
      return true

    return toString.call(instance) == `[object ${expectedTag}]`
  }

  static #testPrototype(shape, instance) {
    if (!('proto' in shape))
      return true

    return Object.getPrototypeOf(instance) === shape.proto
  }

  static [Postcondition](type) {
    assert(false, 'Shapes cannot be extended.')
  }
}
