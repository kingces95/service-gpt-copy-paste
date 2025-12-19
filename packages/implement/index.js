import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/extend'
import { Reflection } from '@kingjs/reflection'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept } from '@kingjs/concept'

const {
  isExtensionOf,
} = Reflection

export function implement(type, concept, implementation = { }) {
  assert(typeof type == 'function',
    'Type must be a function (e.g. class or function).')
  assert(isExtensionOf(concept, Concept),
    'Argument concept must extend Concept.')

  // if pojo, create anonymous partial class from pojo
  implementation = PartialReflect.defineType(implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(PartialReflect.keys(concept))
  for (const name of PartialReflect.keys(implementation)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept, implementation)
}
