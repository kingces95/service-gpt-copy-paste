import { assert } from '@kingjs/assert'
import { abstract } from '@kingjs/abstract'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { PartialObject } from '@kingjs/partial-object'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialClass, Extends } from '@kingjs/partial-class'

const {
  hasGetter,
  hasSetter,
  hasMethod,
  hasData,
} = Descriptor

const {
  ownStaticMemberKeys,
  isExtensionOf,
} = Reflection

export const Concepts = Symbol('Concept.Concepts')

const KnownStaticMembers = new Set([
  Extends,
  Concepts,
])

export class Concept extends PartialObject {
  static [PartialObject.OwnCollectionSymbols] = {
    ...PartialClass[PartialObject.OwnCollectionSymbols],
    [Concepts]: { expectedType: Concept },
  }

  // `myInstance instanceof myConcept` tests if an instance satsifies a concept.
  // Justification to override Symbol.hasInstance: There should never exist an
  // instance of a PartialObject much less a Concept (except for the prototype of
  // the class itself). So it is reasonable to override the behavior of
  // instanceof to test if an instance satisfies the concept. For reflection, use
  // Reflection.isExtensionOf(type, concept).
  static [Symbol.hasInstance](instance) {
    return ConceptReflect.satisfies(instance, this)
  }

  static [PartialObject.Compile](descriptor) {
    const result = super[PartialObject.Compile](descriptor)

    assert(!hasData(result), [
      `Concept members cannot be data properties.`,
      `Use accessor or method instead.`].join(' '))

    // make all concept members abstract
    if (hasGetter(result)) 
      result.get = abstract

    if (hasSetter(result)) 
      result.set = abstract

    if (hasMethod(result)) 
      result.value = abstract

    return result
  }
}

export class ConceptReflect {
  static isConcept(type) {
    const collectionType = PartialReflect.getPartialObjectType(type)
    return collectionType == Concept
  }

  static *concepts(type) {
    for (const collection of PartialReflect.extensions(type)) {
      if (!ConceptReflect.isConcept(collection)) continue
      yield collection
    }
  }
  static *ownConcepts(type) {
    for (const collection of PartialReflect.ownExtensions(type)) {
      if (!ConceptReflect.isConcept(collection)) continue
      yield collection
    }
  }
  static *getConceptHosts(type, name) {
    const hosts = [...PartialReflect.hosts(type, name)]
    yield* hosts.filter(host => ConceptReflect.isConcept(host))
  }

  static *associatedConcepts(type) {
    const map = new Map()
    
    yield* ConceptReflect.ownAssociatedConcepts(type)
    for (const concept of PartialReflect.extensions(type))
      yield *ConceptReflect.associatedConcepts(concept)
  }
  static *ownAssociatedConcepts(type) {
    if (!ConceptReflect.isConcept(type))
      return

    for (const name of ownStaticMemberKeys(type)) {
      if (KnownStaticMembers.has(name)) continue

      const concept = type[name]
      if (typeof concept != 'function') continue
      if (!isExtensionOf(concept, Concept)) continue

      yield [name, concept]
    }
  }

  static satisfies(instance, concept) {
    if (typeof instance != 'object' || instance == null)
      return false

    assert(isExtensionOf(concept, Concept),
      `Argument concept must extend Concept.`)

    // Associate concepts allow for 
    //   myContainer instanceof InputContainerConcept
    // where MyContainer declares associated type as
    //   static cursorType = InputCursor
    // and InputContainerConcept declares associated concept as
    //   static cursorType = InputCursorConcept
    for (const [name, associatedConcept] of 
      ConceptReflect.associatedConcepts(concept)) {
        
      const type = instance?.constructor
      if (!(name in type)) 
        return false

      const associatedType = type?.[name]
      if (!(typeof associatedType == 'function')) 
        return false

      if (!(associatedType.prototype instanceof associatedConcept)) 
        return false 
    }

    for (const name of PartialReflect.keys(concept)) {
      if (name in instance) continue 
      return false
    }

    return true
  }
}
