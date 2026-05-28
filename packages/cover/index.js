import { Descriptor } from '@kingjs/descriptor'

export function cover(pojo) {
  for (const key of Reflect.ownKeys(pojo)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(pojo, key)

    Descriptor.cover(descriptor, pojo)
  }

  return pojo
}
