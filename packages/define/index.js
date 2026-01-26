import { isPojo } from '@kingjs/pojo-test'
import { isAbstract } from '@kingjs/abstract'

export class Define {

  static property(type, key, descriptor) {
    const prototype = type.prototype

    // only overwrite existing abstract members and then only
    // if the new member is not also abstract.
    if (key in prototype) {
      if (isAbstract(descriptor)) return false
      // const existingDescriptor = Descriptor.get(prototype, key)
      // if (!isAbstract(existingDescriptor)) return false
    }

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
  
  static type(pojoOrType, base = Object) {
    if (isPojo(pojoOrType)) {
      const [type] = [class extends base { }]
      const prototype = type.prototype
  
      for (const key of Reflect.ownKeys(pojoOrType)) {
        if (key === 'constructor') continue
        const descriptor = Object.getOwnPropertyDescriptor(pojoOrType, key)
        Object.defineProperty(prototype, key, descriptor)
      }
  
      return type
    }

    return pojoOrType
  }
}