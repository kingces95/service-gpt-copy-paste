import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { extend } from '@kingjs/extend'
import { abstract } from '@kingjs/abstract'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { PartialReflect } from '@kingjs/partial-reflect'
import { TransparentPartialClass } from '@kingjs/transparent-partial-class'
import { PartialClass, Extensions } from '@kingjs/extension-group'
import { PartialObject } from '@kingjs/partial-object'

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
  Extensions,
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
    if (!instance) 
      return false

    return satisfies(instance, this)
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

  static *associatedConcepts() {
    yield* this.ownAssociatedConcepts()
    for (const concept of PartialReflect.collections(this))
      yield *concept.associatedConcepts()
  }
  static *ownAssociatedConcepts() {
    for (const name of ownStaticMemberKeys(this)) {
      if (KnownStaticMembers.has(name)) continue

      const concept = this[name]
      if (typeof concept != 'function') continue
      if (!isExtensionOf(concept, Concept)) continue
      
      const descriptor = Object.getOwnPropertyDescriptor(this, name)
      if (!descriptor?.enumerable) continue

      yield [name, concept]
    }
  }
}

export class ConceptReflect {
  static isConcept(type) {
    const collectionType = PartialReflect.getPartialObjectType(type)
    return collectionType == Concept
  }

  static *concepts(type) {
    for (const collection of PartialReflect.collections(type)) {
      if (!ConceptReflect.isConcept(collection)) continue
      yield collection
    }
  }
  static *ownConcepts(type) {
    for (const collection of PartialReflect.ownCollections(type)) {
      if (!ConceptReflect.isConcept(collection)) continue
      yield collection
    }
  }
  static *getConcepts(type, name) {
    const hosts = [...PartialReflect.hosts(type, name)]
    yield* hosts.filter(host => ConceptReflect.isConcept(host))
  }
}

export function satisfies(instance, concept) {
  assert(isExtensionOf(concept, Concept),
    `Argument concept must extend Concept.`)

  // Associate concepts allow for 
  //   myContainer instanceof InputContainerConcept
  // where MyContainer declares associated type as
  //   static cursorType = InputCursor
  // and InputContainerConcept declares associated concept as
  //   static cursorType = InputCursorConcept
  for (const [name, associatedConcept] of concept.associatedConcepts()) {
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

export function implement(type, concept, implementation = { }) {
  assert(typeof type == 'function',
    'Type must be a function (e.g. class or function).')
  assert(isExtensionOf(concept, Concept),
    'Argument concept must extend Concept.')

  // if pojo, create anonymous partial class from pojo
  if (isPojo(implementation))
    implementation = TransparentPartialClass.create(implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(PartialReflect.keys(concept))
  for (const name of PartialReflect.keys(implementation)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept, implementation)
}
