import { assert } from '@kingjs/assert'
import { asArray } from '@kingjs/as-array'
import {
  applyDefaults,
  applyTransforms,
  defaultTo,
} from '@kingjs/function-args'

export { Preconditions } from '@kingjs/partial-symbols'
export { applyDefaults, applyTransforms, defaultTo } from '@kingjs/function-args'

export function thunk(metadata, fn) {
  if (typeof metadata == 'function') {
    fn = metadata
    metadata = null
  }

  if (!fn)
    fn = () => { }

  assert(typeof fn == 'function',
    'Argument must be a function.')

  metadata = normalizeMetadata(metadata)
  const defaults = normalizeDefaults(metadata.defaults)
  const transforms = normalizeTransforms(metadata.transforms)

  const result = function(...args) {
    args = applyDefaults(args, defaults, this)
    args = applyTransforms(args, transforms, this)
    return fn.apply(this, args)
  }

  Object.defineProperty(result, 'name', {
    value: fn.name,
    configurable: true,
  })

  return result
}

export function contract(requirements, defaults, fn) {
  if (typeof requirements == 'function') {
    fn = requirements
    requirements = null
    defaults = null
  }

  else if (isMetadata(requirements)) {
    fn = defaults
    defaults = requirements
    requirements = null
  }

  else if (typeof defaults == 'function') {
    fn = defaults
    defaults = null
  }

  if (!fn)
    fn = () => { }

  assert(typeof fn == 'function',
    'Argument must be a function.')

  const metadata = normalizeMetadata(defaults)
  requirements = normalizeRequirements(requirements)
  defaults = normalizeDefaults(metadata.defaults)
  const target = thunk(metadata, fn)

  const result = function(...args) {
    args = applyDefaults(args, defaults, this)
    checkSlots(requirements, args)
    return target.apply(this, args)
  }

  Object.defineProperty(result, 'name', {
    value: fn.name,
    configurable: true,
  })

  return result
}

function normalizeMetadata(metadata) {
  if (metadata == null)
    return { }

  if (Array.isArray(metadata))
    return { defaults: metadata }

  assert(typeof metadata == 'object',
    'Function contract metadata must be an object.')

  return metadata
}

function isMetadata(value) {
  return value && typeof value == 'object' && !Array.isArray(value)
}

export function overload(requirements, defaults, overloads, fn) {
  if (typeof defaults == 'function') {
    fn = defaults
    defaults = null
    overloads = null
  }

  else if (typeof overloads == 'function') {
    fn = overloads
    overloads = defaults
    defaults = null
  }

  overloads = normalizeOverloads(overloads)

  return contract(requirements, defaults,
    function dispatch(...args) {
      for (const overload of overloads)
        if (matches(overload.when, args) && overload.where.apply(this, args))
          return overload.use.apply(this, args)

      return fn.apply(this, args)
    })
}

function normalizeRequirements(requirements) {
  if (requirements == null)
    return null

  assert(Array.isArray(requirements),
    'Function contract types must be an array.')

  return requirements.map(asArray)
}

function normalizeOverloads(overloads) {
  if (overloads == null)
    return []

  assert(Array.isArray(overloads),
    'Function overloads must be an array.')

  return overloads.map(overload => {
    assert(typeof overload?.use == 'function',
      'Function overload must define use.')

    const where = overload.where ?? (() => true)

    assert(typeof where == 'function',
      'Function overload where must be a function.')

    return {
      ...overload,
      when: normalizeRequirements(overload.when),
      where,
    }
  })
}

function normalizeDefaults(defaults) {
  if (defaults == null)
    return null

  assert(Array.isArray(defaults),
    'Function contract defaults must be an array.')

  return defaults
}

function normalizeTransforms(transforms) {
  if (transforms == null)
    return null

  assert(Array.isArray(transforms),
    'Function contract transforms must be an array.')

  return transforms
}

function matches(types, values) {
  if (types == null)
    return true

  for (let i = 0; i < types.length; i++)
    if (!matchesSlot(types[i], values[i]))
      return false

  return true
}

function matchesSlot(type, value) {
  if (type == null)
    return true

  if (Array.isArray(type)) {
    for (const current of type)
      if (!matchesSlot(current, value))
        return false

    return true
  }

  return value instanceof type
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
