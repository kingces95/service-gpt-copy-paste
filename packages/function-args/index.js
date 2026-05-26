import { assert } from '@kingjs/assert'

// ____________________________________________________________________________
// DEFAULTS

const DefaultFactory = Symbol('FunctionArgs.DefaultFactory')

export function defaultTo(factory) {
  assert(typeof factory == 'function',
    'Function argument default factory must be a function.')

  return {
    [DefaultFactory]: factory,
  }
}

export function applyDefaults(args, defaults, self) {
  if (defaults == null)
    return args

  args = [...args]

  for (let i = 0; i < defaults.length; i++) {
    if (args[i] !== undefined)
      continue

    if (defaults[i] === undefined)
      continue

    const current = defaults[i]
    args[i] = isDefaultFactory(current)
      ? current[DefaultFactory]({ self, args, index: i })
      : current
  }

  return args
}

function isDefaultFactory(value) {
  return value && typeof value == 'object' && DefaultFactory in value
}

// ____________________________________________________________________________
// TRANSFORMS

export function applyTransforms(args, transforms, self) {
  if (!transforms)
    return args

  args = [...args]

  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i]
    if (!transform)
      continue

    args[i] = transform.call(self, args[i])
  }

  return args
}

// ____________________________________________________________________________
// WRAPPERS

export function transform(fn, transforms) {
  if (!transforms)
    return fn

  return function(...args) {
    args = applyTransforms(args, transforms, this)
    return fn.apply(this, args)
  }
}
