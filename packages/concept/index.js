import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Extension, Extensions } from '@kingjs/extension'
import { extend } from '@kingjs/extend'
import { abstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'
import { isPojo } from '@kingjs/pojo-test'

import { 
  PartialClass,
} from '@kingjs/partial-class'

const {
  hasGetter,
  hasSetter,
  hasMethod,
  hasData,
} = Descriptor

const {
  ownStaticMemberNamesAndSymbols,
  ownMemberNamesAndSymbols,
  isExtensionOf,
} = Reflection

export const Concepts = Symbol('ConceptConcepts')

const KnownStaticMembers = new Set([
  Extensions,
  Concepts,
])

export class Concept extends PartialClass {
  static *[PartialClass.Symbol.ownDeclarations]() { 
    yield *this[PartialClass.Private.fromDeclaration](Concepts, Concept)
    yield *this[PartialClass.Private.fromDeclaration](Extensions)
  }

  // `myInstance instanceof myConcept` tests if an instance satsifies a concept.
  // Justification to override Symbol.hasInstance: There should never exist an
  // instance of a PartialClass much less a Concept (except for the prototype of
  // the class itself). So it is reasonable to override the behavior of
  // instanceof to test if an instance satisfies the concept. For reflection, use
  // Reflection.isExtensionOf(type, concept).
  static [Symbol.hasInstance](instance) {
    if (!instance) 
      return false

    return satisfies(instance, this)
  }

  static [PartialClass.Symbol.preCondition](type) {
    // Concept must have a name.
    assert(typeof this.name == 'string' && this.name.length,
      `Concept must have a name.`)
  }

  static [PartialClass.Symbol.compile](descriptor) {
    const result = super[PartialClass.Symbol.compile](descriptor)

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

  // Skip adding abstract member to the prototype if a member already exists.
  static [PartialClass.Symbol.bind](type, name, descriptor) {
    assert(!isExtensionOf(type, Concept),
      `Concept ${type.name} cannot implement concept ${this.name}.`)
    if (name in type.prototype) return null
    return descriptor
  }

  static [PartialClass.Symbol.postCondition](type) {
    assert(satisfies(type.prototype, this),
      `Type ${type.name} does not satisfy concept ${this.name}.`)
  }

  static *associatedConcepts() {
    yield* this.ownAssociatedConcepts()
    for (const concept of this.declarations())
      yield *concept.associatedConcepts()
  }
  static *ownAssociatedConcepts() {
    for (const name of ownStaticMemberNamesAndSymbols(this)) {
      if (KnownStaticMembers.has(name)) continue
      for (const associatedConcept of 
        this[PartialClass.Private.fromDeclaration](name, Concept)) {
        yield [name, associatedConcept]
      }
    }
  }
}

export function satisfies(instance, concept) {
  assert(isExtensionOf(concept, Concept),
    `Argument concept must extend Concept.`)

  for (const [name, associatedConcept] of concept.associatedConcepts()) {
    const type = instance?.constructor
    if (!(name in type)) return false

    const associatedType = type?.[name]
    assert(typeof associatedType == 'function', [
      `Static member '${name.toString()}'`,
      `of type '${type?.name}' must be a type.`
    ].join(' '))

    // For example, allows for 
    //   myContainer instanceof InputContainerConcept
    // where MyContainer declares associated type as
    //   static cursorType = InputCursor
    // and InputContainerConcept declares associated concept as
    //   static cursorType = InputCursorConcept
    if (!(associatedType.prototype instanceof associatedConcept)) return false 
  }

  for (const name of concept.namesAndSymbols()) 
    if (!(name in instance)) return false
  return true
}

export function implement(type, concept, definitions = { }) {
  assert(typeof type == 'function',
    'Type must be a function (e.g. class or function).')
  assert(isExtensionOf(concept, Concept),
    'Argument concept must extend Concept.')

  // if pojo, create anonymous partial class from pojo
  if (isPojo(definitions))
    definitions = Extension.fromPojo(definitions)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(concept.namesAndSymbols())
  for (const name of ownMemberNamesAndSymbols(definitions.prototype)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept, definitions)
}
