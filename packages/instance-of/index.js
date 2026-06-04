import { assert } from '@kingjs/assert'

export function instanceOf(value, type) {
  assert(type, 'type is required')
  assert(typeof type == 'function', 'type must be a function')

  switch (type) {
    case Object: return value != null
    case String: return typeof value == 'string' || value instanceof String
    case Number: return typeof value == 'number' || value instanceof Number
    case Boolean: return typeof value == 'boolean' || value instanceof Boolean
    case Symbol: return typeof value == 'symbol'
    case BigInt: return typeof value == 'bigint'
    default: return value instanceof type
  }
}
