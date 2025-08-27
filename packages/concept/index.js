import assert from 'assert'
import { isPojo } from '@kingjs/pojo-test'
import { Reflection } from '@kingjs/reflection'
import { 
  Compile, 
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
} = Reflection

export const InstanceOf = Symbol('InstanceOf')
export const ConceptDeclaredSet = Symbol('ConceptDeclaredSet')

export class Concept extends PartialClass { 
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
    if (this[InstanceOf]) 
      return this[InstanceOf](instance)

    return conceptOf(instance, this)
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
    let conceptSet = type[ConceptDeclaredSet]
    if (!conceptSet) 
      conceptSet = type[ConceptDeclaredSet] = new Set()
    conceptSet.add(this)
  }

  static [PostCondition](type) {
    assert(conceptOf(type.prototype, this),
      `Type ${type.name} does not satisfy concept ${this.name}.`)
  }
}

export function conceptOf(instance, concept) {
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