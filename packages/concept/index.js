import { assert } from '@kingjs/assert'
import { abstract } from '@kingjs/abstract'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { UserReflect } from '@kingjs/user-reflect'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { PartialType, PartialTypeReflect } from '@kingjs/partial-type'
import { PartialReflect, isKey } from '@kingjs/partial-reflect'
import { PartialClass, Extends } from '@kingjs/partial-class'

export const Implements = Symbol('Concept.Implements')

const KnownStaticMembers = new Set([
  Extends,
  Implements,
])

export class Concept extends PartialType {
  static [PartialType.OwnCollectionSymbols] = {
    ...PartialClass[PartialType.OwnCollectionSymbols],
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
    const result = super[PartialType.Compile](descriptor)

    const type = Es6Descriptor.typeof(result)
    switch (type) { 
      case 'getter':
        result.get = abstract
        break
      case 'setter':
        result.set = abstract
        break
      case 'property':
        result.get = abstract
        result.set = abstract
        break
      case 'method':
        result.value = abstract
        break
      default:
        assert(false, [
          `Concept members must be accessors or methods`,
          `not ${type}.`].join(' '))
    }

    return result
  }
}

export class ConceptReflect {
  static isConcept(type) {
    const collectionType = PartialTypeReflect.getPartialType(type)
    return collectionType == Concept
  }

  static *concepts(type) {
    for (const object of PartialReflect.partialExtensions(type)) {
      if (!ConceptReflect.isConcept(object)) continue
      yield object
    }
  }
  static *ownConcepts(type) {
    for (const object of PartialReflect.ownPartialExtensions(type)) {
      if (!ConceptReflect.isConcept(object)) continue
      yield object
    }
  }
  static *getConceptHosts(type, name) {
    for (const host of PartialReflect.hosts(type, name)) {
      if (!ConceptReflect.isConcept(host)) continue
      yield host
    }
  }

  static *associatedConcepts(type) {
    if (!ConceptReflect.isConcept(type)) return

    yield* ConceptReflect.ownAssociatedConcepts(type)
    for (const concept of ConceptReflect.concepts(type))
      yield *ConceptReflect.associatedConcepts(concept)
  }
  static *ownAssociatedConcepts(type) {
    if (!ConceptReflect.isConcept(type)) return

    for (const name of UserReflect.ownKeys(type, { isStatic: true })) {
      if (KnownStaticMembers.has(name)) continue

      const concept = type[name]
      if (typeof concept != 'function') continue
      if (!Es6Reflect.isExtensionOf(concept, Concept)) continue

      yield [name, concept]
    }
  }

  static satisfies(instance, concept) {
    if (!ConceptReflect.isConcept(concept)) return false
    if (typeof instance != 'object' || instance == null) return false

    assert(Es6Reflect.isExtensionOf(concept, Concept),
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

    for (const name of PartialReflect.keys(concept)
      .filter(isKey)) {
      if (name in instance) continue 
      return false
    }

    return true
  }
}
