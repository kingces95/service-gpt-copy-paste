import { assert } from '@kingjs/assert'
import { abstract } from '@kingjs/abstract'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { UserReflect } from '@kingjs/user-reflect'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { PartialType, PartialTypeReflect } from '@kingjs/partial-type'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { Descriptor } from '@kingjs/descriptor'

export const Implements = Symbol('Concept.Implements')

const KnownStaticMembers = new Set([
  Extends,
  Implements,
])

export class Concept extends PartialType {
  static [PartialType.PartialTypes] = {
    ...PartialClass[PartialType.PartialTypes],
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
    for (const object of PartialReflect.partialTypes(type)) {
      if (!ConceptReflect.isConcept(object)) continue
      yield object
    }
  }
  static *ownConcepts(type) {
    for (const object of PartialReflect.ownPartialTypes(type)) {
      if (!ConceptReflect.isConcept(object)) continue
      yield object
    }
  }
  static *getConceptOwnHosts(type, name) {
    for (const host of PartialReflect.hosts(type, name)) {
      if (!ConceptReflect.isConcept(host)) continue
      if (!Object.hasOwn(host.prototype, name)) continue
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

      yield name
      yield concept
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
    const ctor = instance?.constructor
    let associatedType
    for (const current of ConceptReflect.associatedConcepts(concept)) {
      if (!ctor) return false

      switch (typeof current) {
        case 'string': 
          const name = current
          if (!(name in ctor)) return false
          associatedType = ctor[name]
          if (!(typeof associatedType == 'function')) return false
          break
        case 'function': 
          const associatedConcept = current
          if (!(associatedType.prototype instanceof associatedConcept)) 
            return false 
          break
        default: 
          assert(false, `Unexpected type: ${typeof current}`)
      }  
    }

    let owner
    let name
    let instanceDescriptor, instanceType
    for (const current of PartialReflect.descriptors(concept)) {
      switch (typeof current) {
        case 'function': owner = current; break
        case 'string': 
        case 'symbol': 
          name = current
          if (!(name in instance)) return false 
          instanceDescriptor = Descriptor.get(instance, name)
          instanceType = Descriptor.typeof(instanceDescriptor)
          break
        case 'object': {
          const conceptDescriptor = current
          const conceptType = Descriptor.typeof(conceptDescriptor)
          if (instanceType == conceptType) continue
          if (instanceType == 'property') {
            if (conceptType == 'getter') continue
            if (conceptType == 'setter') continue
          }
          return false
        }
      }
    }

    return true
  }
}
