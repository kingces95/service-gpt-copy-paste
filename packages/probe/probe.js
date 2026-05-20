import { assert } from '@kingjs/assert'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { Metadata } from '@kingjs/metadata'

// ____________________________________________________________________________
// DUCK TESTING

// A Probe can be used to test if an instance satisfies a probe using 
// instanceof. That test is commonly called duck typing or duck casting. 
// The idea is that if an instance has the right probe, then it can be treated
// as if it were an instance of the probe. For example, if an instance has a
// method called "then", then it can be treated as a thenable and used with 
// Promise.resolve.

// A Probe declaration is precise ES6 metadata:

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
// Probes, on the other hand, are defined in Es6 but the instances are wild 
// and unregulated so we have to be permissive and observational when testing 
// instanceof. So the relationship between probe and concept is:

//    Probe definitions are strict.
//    Probe matching is permissive and observational.
//    Concept matching is certified and non-observational.

// ____________________________________________________________________________
// TYPESCRIPT vs SHAPE vs CONCEPT

//    TypeScript:
//      structural typing over declarations
//    
//    Probe:
//      structural typing over observations
//    
//    Concept:
//      structural typing over certification

const toString = Object.prototype.toString
const ProbeReflect = Es6Reflector.create({
  knownTypes: [ Metadata, Object ],
  knownKeys: [ 'constructor' ],
})

export class Probe extends Metadata {
  // The default instanceof behavior would always be false because
  // Probe is an abstract type in that Probe is a pure metadata
  // construct so should never be instantiated so no instance would
  // ever exist. This fact justifies overriding Symbol.hasInstance
  // to provide an alternative behavior which is to test if an instance
  // satisfies a probe.
  //
  // A probe is satisfied if:
  //
  //   (1) the instance satisfies any static whole-value constraints
  //       such as typeof, tag, prototype, or constructability
  //   (2) the instance can be duck cast to the probe.

  static [Symbol.hasInstance](instance) {
    if (this == Probe)
      return false

    // assert directly extends probe
    assert(Object.getPrototypeOf(this) === Probe,
      `Probe "${this.name}" must directly extend Probe.`)

    if (instance == null)
      return false

    if (!Probe.#testTypeof(this, instance))
      return false

    if (!Probe.#testTag(this, instance))
      return false

    if (!Probe.#testPrototype(this, instance))
      return false

    if (!Probe.#testProtoPrototype(this, instance))
      return false

    return ProbeReflect.canDuckCast(this, Object(instance))
  }

  static #testTypeof(probe, instance) {
    if (!('typeof' in probe))
      return true

    return typeof instance == probe.typeof
  }

  static #testProtoPrototype(probe, instance) {
    if (!('protoPrototype' in probe))
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

    const protoPrototype = probe.protoPrototype

    if (descriptor.enumerable != protoPrototype.enumerable)
      return false

    if ('writable' in protoPrototype &&
      descriptor.writable != protoPrototype.writable)
      return false

    if (descriptor.configurable != protoPrototype.configurable)
      return false

    return true
  }

  static #testTag(probe, instance) {
    const expectedTag = probe.tag
    if (expectedTag === undefined)
      return true

    return toString.call(instance) == `[object ${expectedTag}]`
  }

  static #testPrototype(probe, instance) {
    if (!('proto' in probe))
      return true

    return Object.getPrototypeOf(instance) === probe.proto
  }
}
