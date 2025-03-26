// Elegant and minimal Set utilities

function toSet(value) {
  return value instanceof Set ? value : new Set()
}

export function setUnion(setA, setB) {
  const a = toSet(setA), b = toSet(setB)
  return new Set([...a, ...b])
}

export function setIntersection(setA, setB) {
  const a = toSet(setA), b = toSet(setB)
  return new Set([...a].filter(element => b.has(element)))
}

export function setDifference(setA, setB) {
  const a = toSet(setA), b = toSet(setB)
  return new Set([...a].filter(element => !b.has(element)))
}

export function setSymmetricDifference(setA, setB) {
  return setDifference(
    setUnion(setA, setB),
    setIntersection(setA, setB)
  )
}

export function setIsSubset(subset, superset) {
  const sub = toSet(subset), sup = toSet(superset)
  for (const value of sub)
    if (!sup.has(value)) return false
  return true
}

export function setIsSuperset(superset, subset) {
  return setIsSubset(subset, superset)
}

export function setEquals(setA, setB) {
  const a = toSet(setA), b = toSet(setB)
  return a.size === b.size && setIsSubset(a, b)
}

export function setClone(originalSet) {
  return new Set(toSet(originalSet))
}

export function setDeepClone(originalSet) {
  return new Set(
    [...toSet(originalSet)].map(item =>
      typeof item === 'object' && item !== null
        ? structuredClone?.(item) ?? JSON.parse(JSON.stringify(item))
        : item
    )
  )
}