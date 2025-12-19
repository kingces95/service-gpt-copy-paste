import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { extend } from '@kingjs/extend'
import { abstract } from '@kingjs/abstract'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { MemberReflect } from '@kingjs/member-reflect'
import { PartialClass } from '@kingjs/partial-class'
import { ExtensionGroup, Extensions } from '@kingjs/extension-group'
import { MemberCollection } from '@kingjs/member-collection'

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

export class Concept extends MemberCollection {
  static [MemberCollection.OwnCollectionSymbols] = {
    ...ExtensionGroup[MemberCollection.OwnCollectionSymbols],
    [Concepts]: { expectedType: Concept },
  }

  // `myInstance instanceof myConcept` tests if an instance satsifies a concept.
  // Justification to override Symbol.hasInstance: There should never exist an
  // instance of a MemberCollection much less a Concept (except for the prototype of
  // the class itself). So it is reasonable to override the behavior of
  // instanceof to test if an instance satisfies the concept. For reflection, use
  // Reflection.isExtensionOf(type, concept).
  static [Symbol.hasInstance](instance) {
    if (!instance) 
      return false

    return satisfies(instance, this)
  }

  static [MemberCollection.Compile](descriptor) {
    const result = super[MemberCollection.Compile](descriptor)

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
    for (const concept of MemberReflect.collections(this))
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
    const collectionType = MemberReflect.getCollectionType(type)
    return collectionType == Concept
  }

  static *concepts(type) {
    for (const collection of MemberReflect.collections(type)) {
      if (!ConceptReflect.isConcept(collection)) continue
      yield collection
    }
  }
  static *ownConcepts(type) {
    for (const collection of MemberReflect.ownCollections(type)) {
      if (!ConceptReflect.isConcept(collection)) continue
      yield collection
    }
  }
  static *getConcepts(type, name) {
    const hosts = [...MemberReflect.hosts(type, name)]
    yield* hosts.filter(host => ConceptReflect.isConcept(host))
  }
}

export function satisfies(instance, concept) {
  assert(isExtensionOf(concept, Concept),
    `Argument concept must extend Concept.`)

  // Associated concepts allow for 
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

  for (const name of MemberReflect.keys(concept)) {
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
    implementation = PartialClass.create(implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(MemberReflect.keys(concept))
  for (const name of MemberReflect.keys(implementation)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept, implementation)
}
