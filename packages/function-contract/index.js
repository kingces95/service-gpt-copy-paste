import { assert } from '@kingjs/assert'
import { asArray } from '@kingjs/as-array'
import { asMetadata } from '@kingjs/as-metadata'
import { declareName } from '@kingjs/es6-define'
import { instanceOf } from '@kingjs/instance-of'
import { Signature } from '@kingjs/partial-symbols'
import {
  applyDefaults,
  applyTransforms,
  defaultTo,
} from '@kingjs/function-args'

export { Preconditions } from '@kingjs/partial-symbols'
export { applyDefaults, applyTransforms, defaultTo } from '@kingjs/function-args'

export function thunk(metadata, fn) {
  if (metadata && typeof metadata == 'object' && 'method' in metadata) {
    const { method, ...rest } = metadata
    return declareName(thunk(rest, method), Signature)
  }

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

  return declareName(result, fn.name)
}

export function contract(requirements, metadata, fn) {
  if (typeof requirements == 'function') {
    fn = requirements
    requirements = null
    metadata = null
  }

  else if (isMetadata(requirements) && typeof metadata == 'function') {
    fn = metadata
    metadata = requirements
    requirements = null
  }

  else if (typeof metadata == 'function') {
    fn = metadata
    metadata = null
  }

  if (!fn)
    fn = () => { }

  assert(typeof fn == 'function',
    'Argument must be a function.')

  requirements = normalizeRequirements(requirements)
  metadata = normalizeMetadata(metadata)
  const names = normalizeNames(metadata.names)
  const defaults = normalizeDefaults(metadata.defaults)
  const preconditions = normalizePreconditions(metadata.precondition)

  const result = function(...args) {
    args = applyDefaults(args, defaults, this)
    checkSlots(requirements, args, names)
    runPreconditions(preconditions, this, args)
    return fn.apply(this, args)
  }

  return declareName(result, fn.name)
}

function normalizeMetadata(metadata) {
  if (metadata == null)
    return { }

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
  const metadata = isMetadata(defaults)
    ? defaults
    : { defaults }

  return contract(requirements, metadata,
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

function normalizePreconditions(precondition) {
  if (precondition == null)
    return null

  const preconditions = asMetadata(precondition)
  for (const current of preconditions)
    assert(typeof current == 'function',
      'Function contract precondition must be a function.')

  return preconditions
}

function normalizeNames(names) {
  if (names == null)
    return null

  assert(Array.isArray(names),
    'Function contract names must be an array.')

  return names
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

  return instanceOf(value, type)
}

function checkSlots(types, values, names) {
  if (types == null)
    return

  for (let i = 0; i < types.length; i++)
    checkSlot(types[i], values[i], names?.[i] ?? i)
}

function checkSlot(type, value, name) {
  if (type == null)
    return

  if (Array.isArray(type)) {
    for (const current of type)
      checkSlot(current, value, name)

    return
  }

  if (instanceOf(value, type))
    return

  throw new TypeError(
    `Argument ${name} must be ${type.name}.`)
}

function runPreconditions(preconditions, self, args) {
  if (preconditions == null)
    return

  for (const precondition of preconditions)
    precondition.apply(self, args)
}
