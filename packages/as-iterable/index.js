export function* asIterable(singletonOrIterable) {
  if (singletonOrIterable == null)
    return
  
  if (typeof singletonOrIterable[Symbol.iterator] === 'function') {
    yield* singletonOrIterable
  } else {
    yield singletonOrIterable
  }
}
