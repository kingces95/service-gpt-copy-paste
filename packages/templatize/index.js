import { contract } from '@kingjs/function-contract'
import { WeakMapLookup } from '@kingjs/weak-map-lookup'

// ____________________________________________________________________________
// TEMPLATIZE

// Function templatize is used to define a generic function of type. A generic
// function or type is simply a function or type that exposes .targs which is
// an array of type arguments. A generic function or type also exposes .as which
// can re-templatize the function with different type arguments.

// Function templatize takes an array of arrays representing the requirements
// of the type arguments followed by a function or type definition. The 
// requirments are enforced by checking if the type arguments are instances
// of the requirements at the time of specialization.

const key = { }

export function templatize(requirements, definition) {
  if (definition == null) {
    definition = requirements
    requirements = null
  }

  if (isType(definition))
    return templatizeType(requirements, definition)

  return templatizeFunction(requirements, definition)
}

function templatizeType(requirements, type) {
  const cache = new WeakMapLookup()

  const specialize = function(...targs) {
    const leaf = cache.get(targs)

    if (leaf.has(key))
      return leaf.get(key)

    class TypeOf extends type { }

    Object.defineProperty(TypeOf, 'name', {
      value: `${type.name}Of`,
      configurable: true,
    })

    defineTemplateSurface(TypeOf, { targs })

    leaf.set(key, TypeOf)
    return TypeOf
  }

  const as = contract(requirements, specialize)

  defineTemplateSurface(type, { as })
  return type
}

function templatizeFunction(requirements, fn) {
  const cache = new WeakMapLookup()

  const specialize = function(...targs) {
    const leaf = cache.get(targs)

    if (leaf.has(key))
      return leaf.get(key)

    const fnOf = fn(...targs)

    defineTemplateSurface(fnOf, { targs, as })

    leaf.set(key, fnOf)
    return fnOf
  }

  const as = contract(requirements, specialize)

  defineTemplateSurface(fn, { as })
  return fn
}

function defineTemplateSurface(target, metadata) {
  const descriptors = { }

  const { targs, as } = metadata

  if (targs) {
    descriptors.targs = {
      value: Object.freeze([...targs]),
    }
  }

  if (as) {
    descriptors.as = {
      value: as,
    }
  }

  Object.defineProperties(target, descriptors)
}

// TODO: replace this with a general constructor probe.
function isType(value) {
  if (typeof value != 'function')
    return false

  return Function.prototype.toString.call(value).startsWith('class ')
}
