import { assert } from '@kingjs/assert'

// TODO: duplicate of as-array?
export function asMetadata(singletonOrArray) {
  if (singletonOrArray == null)
    return []
  
  if (Array.isArray(singletonOrArray))
    return singletonOrArray
  
  return [ singletonOrArray ]
}
