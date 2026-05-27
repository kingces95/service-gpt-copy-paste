export function withMethod(instance, key, wrap, callback) {
  const ownDescriptor = Object.getOwnPropertyDescriptor(instance, key)
  const method = instance[key]

  Object.defineProperty(instance, key, {
    value: wrap(method),
    configurable: true,
    writable: true,
  })
  try {
    return callback()
  }
  finally {
    if (ownDescriptor)
      Object.defineProperty(instance, key, ownDescriptor)
    else
      Reflect.deleteProperty(instance, key)
  }
}
