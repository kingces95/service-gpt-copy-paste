import { assert } from '@kingjs/assert'
import { abstractify } from '@kingjs/abstract'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialType } from '@kingjs/partial-type'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Compiler } from '@kingjs/es6-compiler'

export const Implements = Symbol('Concept.Implements')

const KnownStaticMembers = new Set([
  Extends,
  Implements,
])

export class Concept extends PartialType {
  static [PartialType.Declarations] = {
    ...PartialClass[PartialType.Declarations],
    [Implements]: { expectedType: Concept },
  }

  // `myInstance instanceof myConcept` tests if an instance satsifies a concept.
  // Justification to override Symbol.hasInstance: There should never exist an
  // instance of a PartialType much less a Concept (except for the prototype of
  // the class itself). So it is reasonable to override the behavior of
  // instanceof to test if an instance satisfies the concept. For reflection, use
  // Es6Reflect.isExtensionOf(type, concept).
  static [Symbol.hasInstance](instance) {
    if (this == Concept) 
      return super[Symbol.hasInstance](instance)
    return ConceptReflect.satisfies(instance, this)
  }

  static [PartialType.Compile](descriptor) {
    const compiledDescriptor = super[PartialType.Compile](descriptor)
    const abstractDescriptor = abstractify(compiledDescriptor)
    return abstractDescriptor
  }
}

// TODO: Remove/combine with Concept or extend with Symbol.hasInstance.
export class ImplicitConcept extends PartialType { 
  static [PartialType.Compile](descriptor) {
    const compiledDescriptor = super[PartialType.Compile](descriptor)
    const abstractDescriptor = abstractify(compiledDescriptor)
    return abstractDescriptor
  }
}

const AssociatedConceptReflect = new Es6Prototype({
  knownKeys: [ 'constructor' ],
  getPrototypeFn: concept => {
    const hierarchy = [...PartialReflect.hierarchy(concept)]

    return hierarchy.reverse().reduce((prototype, current) => {
      const descriptors = { }

      const options = { isStatic: true }
      for (const key of PartialReflect.ownKeys(current, options)) {
        if (KnownStaticMembers.has(key)) continue

        const associatedConcept = concept[key]
        if (typeof associatedConcept != 'function') continue
        if (!Es6Reflect.isExtensionOf(associatedConcept, Concept)) continue

        descriptors[key] = Es6Compiler.emit({ value: associatedConcept })
      }

      return Es6Prototype.createLink(current, prototype, descriptors)
    }, null)
  }
})

export class ConceptReflect {
  static *ownAssociatedConcepts(type) {
    for (const key of AssociatedConceptReflect.ownKeys(type)) {
      yield key
      yield type[key]
    }
  }

  static *associatedConcepts(type) {
    for (const current of AssociatedConceptReflect.hierarchy(type))
      yield* ConceptReflect.ownAssociatedConcepts(current)
  }

  static #satisfiesAssociations(instance, concept) {
    // Associate concepts allow for 
    //   myContainer instanceof InputContainerConcept
    // where MyContainer declares associated type as
    //   static cursorType = InputCursor
    // and InputContainerConcept declares associated concept as
    //   static cursorType = InputCursorConcept
    const ctor = instance?.constructor

    let associatedType
    for (const current of ConceptReflect.associatedConcepts(concept)) {
      assert(typeof current == 'string'
        || typeof current == 'symbol' 
        || typeof current == 'function',
        `Unexpected type: ${typeof current}`)

      switch (typeof current) {
        case 'function':
          if (!(associatedType.prototype instanceof current)) 
            return false
          break
        case 'string':
        case 'symbol':
          associatedType = ctor[current]
          if (!(typeof associatedType == 'function')) 
            return false
          break
      }
    }
    return true
  }

  static satisfies(instance, concept) {
    if (!PartialReflect.isConcept(concept)) return false
    if (typeof instance != 'object' || instance == null) return false

    assert(Es6Reflect.isExtensionOf(concept, Concept),
      `Argument concept must extend Concept.`)

    if (!ConceptReflect.#satisfiesAssociations(instance, concept)) 
      return false

    return Es6Reflect.canDuckCast(concept, instance)
  }
}
