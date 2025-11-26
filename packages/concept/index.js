import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { 
  Extension, 
  Extensions, 
} from '@kingjs/extension'
import { extend } from '@kingjs/extend'
import { abstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'
import { isPojo } from '@kingjs/pojo-test'
import { 
  Compile,
  OwnDeclarationSymbols,
} from '@kingjs/partial-class'

import { 
  PartialClass, 
  PartialClassReflect,
  AnonymousPartialClass,
} from '@kingjs/partial-class'

const {
  hasGetter,
  hasSetter,
  hasMethod,
  hasData,
} = Descriptor

const {
  ownStaticMemberNamesAndSymbols,
  isExtensionOf,
} = Reflection

export const Concepts = Symbol('Concept.Concepts')

const KnownStaticMembers = new Set([
  Extensions,
  Concepts,
])

export class Concept extends PartialClass {
  static [OwnDeclarationSymbols] = {
    ...Extension[OwnDeclarationSymbols],
    [Concepts]: { expectedType: Concept },
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

  static *associatedConcepts() {
    yield* this.ownAssociatedConcepts()
    for (const concept of PartialClassReflect.declarations(this)) {
      if (!(concept.prototype instanceof Concept)) continue
      yield *concept.associatedConcepts()
    }
  }
  static *ownAssociatedConcepts() {
    for (const name of ownStaticMemberNamesAndSymbols(this)) {
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

  for (const name of PartialClassReflect.memberKeys(concept)) {
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
    implementation = AnonymousPartialClass.create(implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(PartialClassReflect.memberKeys(concept))
  for (const name of PartialClassReflect.memberKeys(implementation)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept, implementation)
}
