import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/partial-extend'
import { isPojo } from '@kingjs/pojo-test'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept, ImplicitConcept } from '@kingjs/concept'
import { PartialLoader } from '@kingjs/partial-loader'
import { es6DefineType } from '@kingjs/es6-define-type'

function isKey(key) {
  return typeof key === 'string' || typeof key === 'symbol'
}

export function implement(type, concept, implementation = { }) {
  assert(typeof type == 'function',
    'Type must be a function (e.g. class or function).')

  // overload: if concept is pojo, create anonymous concept from pojo 
  if (isPojo(concept)) {
    // TODO: clean up. Should use implementation for starters. 
    const implicitConcept = es6DefineType(null, ImplicitConcept, concept)
    return extend(type, implicitConcept, { isTransparent: true })
  }

  assert(Es6Reflect.isExtensionOf(concept, Concept),
    'Argument concept must extend Concept.')
  assert(!Es6Reflect.isExtensionOf(type, Concept),
    'Expected type to not be a PartialType.')

  // if pojo, create anonymous partial class from pojo
  implementation = PartialLoader.load(implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(PartialReflect.keys(concept).filter(isKey))

  for (const name of PartialReflect.keys(implementation).filter(isKey)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept)
  extend(type, implementation)
}
