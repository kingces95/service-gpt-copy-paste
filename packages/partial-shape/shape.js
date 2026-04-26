import { assert } from '@kingjs/assert'
import { PartialType } from '@kingjs/partial-type'
import { Postcondition } from '@kingjs/partial-symbols'
import { PartialReflect } from '@kingjs/partial-reflect'

// ____________________________________________________________________________
// DUCK TESTING

// A Shape can be used to test if an instance satisfies a shape using 
// instanceof. That test is commonly called duck typing or duck casting. 
// The idea is that if an instance has the right shape, then it can be treated
// as if it were an instance of the shape. For example, if an instance has a
// method called "then", then it can be treated as a thenable and used with 
// Promise.resolve.

// A Shape declaration is precise ES6 metadata:

//    method  => wants callable
//    getter  => wants readable
//    setter  => wants writable

// But a candidate object is messy JS reality. For example, EventTarget has 
// methods that are enumerable where as Es6 can be relied upon to make methods
// non-enumerable. Additionally, a candidate may have a getter that returns a 
// function and that should satisfy a method requirement. For example, to know 
// whether candidate.foo is a a method, we must evaluate:

//    typeof candidate.foo === 'function'

// That can invoke a getter. So duck testing is not a pure descriptor-only 
// reflection operation. It is closer to:

//    observational structural probe

// That means it may:

//    invoke getters
//    trigger proxy traps
//    throw
//    observe changing state
//    have side effects

// ____________________________________________________________________________
// SHAPE vs CONCEPT

// Concepts are opt-in using Es6 syntax so can take dependencies on the
// types of descriptors Es6 creates. Instances that use Concepts must opt-in. 
// Shapes, on the other hand, are defined in Es6 but the instances are wild 
// and unregulated so we have to be permissive and observational when testing 
// instanceof. So the relationship between shape and concept is:

//    Shape definitions are strict.
//    Shape matching is permissive and observational.
//    Concept matching is certified and non-observational.

// ____________________________________________________________________________
// TYPESCRIPT vs SHAPE vs CONCEPT

//    TypeScript:
//      structural typing over declarations
//    
//    Shape:
//      structural typing over observations
//    
//    Concept:
//      structural typing over certification

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

    return PartialReflect.canDuckCast(this, Object(instance))
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
