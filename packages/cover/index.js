export function cover(pojo) {
  for (const key of Reflect.ownKeys(pojo)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(pojo, key)

    descriptor.value?.()
    descriptor.get?.call(pojo)
    descriptor.set?.call(pojo)
  }

  return pojo
}
