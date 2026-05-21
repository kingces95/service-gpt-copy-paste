import { assert } from '@kingjs/assert'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialReflect, copyTo } from '@kingjs/partial-reflect'
import { Shape } from '@kingjs/partial-shape'
import { Attachments } from '@kingjs/partial-attachments'
import { From } from '@kingjs/partial-symbols'

function isKey(key) {
  return typeof key === 'string' || typeof key === 'symbol'
}

// TODO: unify code with implement
export function satisfy(type, shape, implementation = { }) {
  assert(typeof type == 'function',
    'Type must be a function (e.g. class or function).')
  assert(Es6Reflect.isExtensionOf(shape, Shape),
    'Argument shape must extend Shape.')
  assert(!Es6Reflect.isExtensionOf(type, Shape),
    'Expected type to not be a Shape.')

  implementation = Attachments[From](implementation)

  const shapeMembers = new Set(PartialReflect.keys(shape).filter(isKey))
  for (const name of PartialReflect.keys(implementation).filter(isKey)) {
    if (shapeMembers.has(name)) continue
    throw new Error(`Shape '${shape.name}' does not define member '${name}'.`)
  }

  copyTo(shape, type)
  copyTo(implementation, type)
}
