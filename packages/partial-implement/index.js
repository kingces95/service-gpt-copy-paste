import { assert } from '@kingjs/assert'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialReflect, copyTo } from '@kingjs/partial-reflect'
import { Concept } from '@kingjs/partial-concept'
import { Attachments } from '@kingjs/partial-attachments'
import { From } from '@kingjs/partial-symbols'

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

  implementation = Attachments[From](implementation)

  // restrict implementation to members defined by the concept.
  const conceptMembers = new Set(PartialReflect.keys(concept).filter(isKey))
  for (const name of PartialReflect.keys(implementation).filter(isKey)) {
    if (conceptMembers.has(name)) continue
    throw new Error(`Concept '${concept.name}' does not define member '${name}'.`)
  }

  copyTo(concept, type)
  copyTo(implementation, type)
}
