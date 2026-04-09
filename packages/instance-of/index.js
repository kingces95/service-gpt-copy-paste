import { assert } from '@kingjs/assert'

export function instanceOf(value, type) {
  assert(type, 'type is required')
  assert(typeof type == 'function', 'type must be a function')

  if (value == null)
    return false

  const object = typeof value == 'object' || typeof value == 'function'
    ? value : Object(value)

  return object instanceof type
}
