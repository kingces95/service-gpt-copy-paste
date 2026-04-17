import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/partial-extend'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept } from '@kingjs/partial-concept'
import { Extensions } from '@kingjs/partial-extensions'
import { Define } from '@kingjs/partial-symbols'

function isKey(key) {
  return typeof key === 'string' || typeof key === 'symbol'
}

export function implement(type, concept, implementation = { }) {
  assert(typeof type == 'function',
    'Type must be a function (e.g. class or function).')

  assert(Es6Reflect.isExtensionOf(concept, Concept),
    'Argument concept must extend Concept.')
  assert(!Es6Reflect.isExtensionOf(type, Concept),
    'Expected type to not be a PartialType.')

  implementation = Extensions[Define](implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(PartialReflect.keys(concept).filter(isKey))

  for (const name of PartialReflect.keys(implementation).filter(isKey)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  extend(type, concept)
  extend(type, implementation)
}
