import { assert } from '@kingjs/assert'

export function asMetadata(singletonOrArray) {
  if (singletonOrArray == null)
    return []
  
  if (Array.isArray(singletonOrArray))
    return singletonOrArray
  
  return [ singletonOrArray ]
}
