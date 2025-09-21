import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Extension, Extensions } from '@kingjs/extension'
import { extend } from '@kingjs/extend'
import { abstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'
import { isPojo } from '@kingjs/pojo-test'

import { 
  PartialClass,
  Compile, 
  Bind,
  PreCondition,
  PostCondition, 
} from '@kingjs/partial-class'

const {
  hasGetter,
  hasSetter,
  hasMethod,
  hasData,
} = Descriptor

const {
  memberNamesAndSymbols,
  isExtensionOf,
} = Reflection

export const Concepts = Symbol('ConceptConcepts')

export const Satisfies = Symbol('ConceptSatisfies')

export class Concept extends PartialClass {
  static *[OwnDeclarations]() { 
    yield *this.fromDeclaration$(Concepts, Concept)
    yield *this.fromDeclaration$(Extensions)
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

    // if concept exposes procedural test by exposing a static Test method,
    // then call it to test if the instance satisfies the concept.
    // For example, RewindContainerConcept has a static Test method
    // that tests if the instance .cusorType is a BidirectionalCursorConcept. 
    if (this[Satisfies]) 
      return this[Satisfies](instance)

    return satisfies(instance, this)
  }

  static [PreCondition](type) {
    // Concept must have a name.
    assert(typeof this.name == 'string' && this.name.length,
      `Concept must have a name.`)

    // Concept cannot be implemented by another concept.
    assert(!isExtensionOf(type, Concept),
      `Concept ${type.name} cannot implement concept ${this.name}.`)

    // Concept cannot indirectly extend Concept.
    const baseType = Object.getPrototypeOf(this)
    assert(baseType == Concept, 
      `Concept ${this.name} must directly extend Concept.`)
  }

  static [Compile](descriptor) {
    const result = super[Compile](descriptor)

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
  static [Bind](type, name, descriptor) {
    assert(!isExtensionOf(type, Concept),
      `Concept ${type.name} cannot implement concept ${this.name}.`)
    if (name in type.prototype) return null
    return descriptor
  }

  static [PostCondition](type) {
    assert(satisfies(type.prototype, this),
      `Type ${type.name} does not satisfy concept ${this.name}.`)
  }
}

export function satisfies(instance, concept) {
  assert(isExtensionOf(concept, Concept),
    `Argument concept must extend Concept.`)

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
  for (const name of memberNamesAndSymbols(definitions.prototype)) {
    if (conceptMembers.has(name)) continue
      throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept, definitions)
}
