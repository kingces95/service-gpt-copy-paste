import { isAbstract } from '@kingjs/abstract'

export class Define {

  static property(type, key, descriptor) {
    const prototype = type.prototype

    if (key in prototype && isAbstract(descriptor)) return false

    Object.defineProperty(prototype, key, descriptor)
    return true
  }

  static properties(type, descriptors) {
    const keys = []
    for (const key of Reflect.ownKeys(descriptors)) {
      const defined = Define.property(type, key, descriptors[key])
      keys.push([key, defined])
    }
    return keys
  }
  
  static type(pojo, base = Object) {
    const [type] = [class extends base { }]
    const prototype = type.prototype

    for (const key of Reflect.ownKeys(pojo)) {
      if (key === 'constructor') continue
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    return type
  }
}