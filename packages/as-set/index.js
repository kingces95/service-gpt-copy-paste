import { asIterable } from "@kingjs/as-iterable"

export function asSet(singletonOrIterableOrSet) {
  if (singletonOrIterableOrSet instanceof Set)
    return singletonOrIterableOrSet
  
  return new Set(asIterable(singletonOrIterableOrSet))
}
