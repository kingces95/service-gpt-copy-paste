import { assert } from '@kingjs/assert'
import { asArray } from '@kingjs/as-array'

export { Preconditions } from '@kingjs/partial-symbols'

export function contract(requirements, fn) {
  if (typeof requirements == 'function') {
    fn = requirements
    requirements = null
  }

  if (!fn)
    fn = () => { }

  assert(typeof fn == 'function',
    'Argument must be a function.')

  requirements = normalizeRequirements(requirements)

  const thunk = function(...args) {
    checkSlots(requirements, args)
    return fn.apply(this, args)
  }

  Object.defineProperty(thunk, 'name', {
    value: fn.name,
    configurable: true,
  })

  return thunk
}

function normalizeRequirements(requirements) {
  if (requirements == null)
    return null

  assert(Array.isArray(requirements),
    'Function contract types must be an array.')

  return requirements.map(asArray)
}

function checkSlots(types, values) {
  if (types == null)
    return

  for (let i = 0; i < types.length; i++)
    checkSlot(types[i], values[i])
}

function checkSlot(type, value) {
  if (type == null)
    return

  if (Array.isArray(type)) {
    for (const current of type)
      checkSlot(current, value)

    return
  }

  if (value instanceof type)
    return

  throw new TypeError(
    `Argument must be an instance of ${type.name}.`)
}
