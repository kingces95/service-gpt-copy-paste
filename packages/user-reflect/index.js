import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { isAbstract } from '@kingjs/abstract'
import { PartialPojo } from '@kingjs/partial-pojo'
import { PartialObject } from '@kingjs/partial-object'

const Filter = { excludeKnown: true }

export class UserReflect {

  static *ownKeys(type, { isStatic } = { }) {
    yield* Es6Reflect.ownKeys(type, { isStatic, ...Filter })
  }
  static *keys(type, { isStatic } = { }) {
    yield* Es6Reflect.keys(type, { isStatic, ...Filter })
  } 
  static getOwnDescriptor(type, key, { isStatic } = { }) {
    return Es6Reflect.getOwnDescriptor(type, key, { isStatic, ...Filter })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    yield* Es6Reflect.getOwnDescriptors(type, { isStatic, ...Filter })
  }
  static *getDescriptor(type, key, { isStatic } = { }) {
    yield* Es6Reflect.getDescriptor(type, key, { isStatic, ...Filter })
  }
  static *descriptors(type, { isStatic } = { }) {
    yield* Es6Reflect.getDescriptors(type, { isStatic, ...Filter })
  }
  static getHost(type, name, { isStatic } = { }) {
    return Es6Reflect.getHost(type, name, { isStatic, ...Filter })
  }

  static defineProperty(type, key, descriptor) {
    const prototype = type.prototype
    
    // only overwrite existing abstract members and then only
    // if the new member is not also abstract.
    if (key in prototype) {
      if (isAbstract(descriptor)) return false
    }
      
    Object.defineProperty(prototype, key, descriptor)
    return true
  }
  static defineProperties(type, descriptors) {
    const keys = []
    for (const key of Reflect.ownKeys(descriptors)) {
      const defined = UserReflect.defineProperty(type, key, descriptors[key])
      keys.push([key, defined])
    }
    return keys
  }

  static defineType(pojoOrType) {
    if (isPojo(pojoOrType)) {
      const [type] = [class extends PartialPojo { }]
      const prototype = type.prototype
  
      for (const key of Reflect.ownKeys(pojoOrType)) {
        if (key === 'constructor') continue
        const descriptor = Object.getOwnPropertyDescriptor(pojoOrType, key)
        Object.defineProperty(prototype, key, descriptor)
      }
  
      return type
    }

    assert(Es6Reflect.isExtensionOf(pojoOrType, PartialObject),
      `Expected arg to be a PartialObject.`)

    return pojoOrType
  }
}
