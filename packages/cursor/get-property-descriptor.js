export function getPropertyDescriptor(prototype, property) {
  while (prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
    if (descriptor) return descriptor
    prototype = Object.getPrototypeOf(prototype)
  }
  return undefined
}

export function getPropertyNames(prototype, root = Object) {
  const names = new Set()
  while (prototype != root.prototype) {
    Object.getOwnPropertyNames(prototype).forEach(name => names.add(name))
    prototype = Object.getPrototypeOf(prototype)
  }
  return Array.from(names)
}
