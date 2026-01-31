export function* asIterable(singletonOrIterable) {
  if (singletonOrIterable == null)
    return
  
  if (typeof singletonOrIterable === 'string')
    return yield singletonOrIterable

  if (typeof singletonOrIterable[Symbol.iterator] === 'function')
    return yield* singletonOrIterable

  yield singletonOrIterable
}
