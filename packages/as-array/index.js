export function asArray(singletonOrArray) {
  if (singletonOrArray == null)
    return []
  
  return Array.isArray(singletonOrArray)
    ? singletonOrArray
    : [singletonOrArray]
}
