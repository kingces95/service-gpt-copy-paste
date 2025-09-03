import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Reflection } from '@kingjs/reflection'
import { 
  Compile, 
  Bind,
  Mark,
  PostCondition, 
  extend,
  PartialClass,
} from '@kingjs/partial-class'
import { abstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'

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

export const Satisfies = Symbol('Satisfies')

// Set of concepts declared directly on a type.
export const OwnDeclaredConcepts = Symbol('OwnDeclaredConcepts')

// Object whose each key is a member of a concept declared on the type 
// or its ancestors. Each value is a Set of the concepts which
// directly declare the member. 
export const DeclaredConceptKeys = Symbol('DeclaredConceptKeys')

export class Concept extends PartialClass {
  static *ownDeclaredConcepts(type) {
    const typeConceptSet = type[OwnDeclaredConcepts]
    if (!typeConceptSet) return
    yield* typeConceptSet
  }

  static fromPojo(pojo) {
    return super.fromPojo(pojo, this)
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

  static [Compile](descriptor) {
    const result = { ...descriptor }

    if (hasData(result)) 
      throw new Error(
        `Concept members cannot be data properties. Use accessor or method instead.`)

    // make all concept members abstract
    if (hasGetter(result)) 
      result.get = abstract

    if (hasSetter(result)) 
      result.set = abstract

    if (hasMethod(result)) 
      result.value = abstract

    return result
  }

  static [Mark](type) {
    // cache concepts directly declared on the type
    let typeConceptSet = type[OwnDeclaredConcepts]
    if (!typeConceptSet) 
      typeConceptSet = type[OwnDeclaredConcepts] = new Set()
    typeConceptSet.add(this)
  }

  // Skip adding abstract member to the prototype if a member already exists.
  static [Bind](type, name, descriptor) {
    if (isExtensionOf(type, Concept)) throw new Error([
      `Concept ${type.name} cannot implement concept ${this.name}.`,
      `Use Extensions instead.`].join(' '))
    if (name in type.prototype) return null
    return descriptor
  }

  static [PostCondition](type) {
    assert(satisfies(type.prototype, this),
      `Type ${type.name} does not satisfy concept ${this.name}.`)
  }
}

export function satisfies(instance, concept) {
  for (const name of memberNamesAndSymbols(concept?.prototype))
    if (!(name in instance)) return false
  return true
}

export function implement(type, concept, definitions = { }) {
  if (!(typeof type === 'function')) throw Error(
    'Type must be a function (e.g. class or function).')

  if (isPojo(concept))
    concept = Concept.fromPojo(concept)
  
  if (!Reflection.isExtensionOf(concept, Concept)) throw Error(
    'Argument concept must extend Concept.')

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(memberNamesAndSymbols(concept.prototype))
  for (const name of memberNamesAndSymbols(definitions)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept ${concept.name} does not define member ${name}.`)
  }
  
  extend(type, concept, definitions)
}