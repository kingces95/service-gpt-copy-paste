import { assert } from '@kingjs/assert'
import { contract } from '@kingjs/function-contract'
import { TypeTupleCache } from '@kingjs/type-tuple-cache'

export function genericMethod(...args) {
  const specialize = contract(...args)

  return function of(...types) {
    assertTypes(types)

    const result = specialize(...types)

    assert(typeof result == 'function',
      'Generic method must return a function.')

    return result
  }
}

export function genericType(...args) {
  const of = genericMethod(...args)
  const cache = new TypeTupleCache()

  return function TypeOf(...types) {
    assert(!new.target,
      'Generic type specializer cannot be constructed.')

    return cache.getOrCreate(types, () => of(...types))
  }
}

function assertTypes(types) {
  for (const type of types)
    assert(typeof type == 'function',
      'Generic arguments must be types.')
}
