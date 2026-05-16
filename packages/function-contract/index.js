import { assert } from '@kingjs/assert'

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

function checkSlots(types, values) {
  if (types == null)
    return

  assert(Array.isArray(types),
    'Function contract types must be an array.')

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
