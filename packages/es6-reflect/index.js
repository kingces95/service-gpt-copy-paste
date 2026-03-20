import { 
  Es6Reflector,
  Es6UserReflector,
} from '@kingjs/es6-reflector'

class Es6LegacyReflect {
  #userReflector
  #reflector

  constructor() {
    this.#userReflector = new Es6UserReflector()
    this.#reflector = new Es6Reflector()
  }

  #getReflector({ excludeKnown } = { }) {
    return excludeKnown 
      ? this.#userReflector 
      : this.#reflector
  }

  typeof(type, key, descriptor, options = { }) {
    return this.#getReflector(options).typeof(type, key, descriptor)
  }
  *hierarchy(type, options = { }) {
    yield* this.#getReflector(options).hierarchy(type)
  }
  baseType(type, options = { }) {
    return this.#getReflector(options).getBaseType(type)
  }
  *baseTypes(type, options = { }) {
    yield* this.#getReflector(options).baseTypes(type)
  }
  isExtensionOf(type, targetType, options = { }) {
    return this.#getReflector(options).isExtensionOf(type, targetType)
  }
  isAbstract(type, options = { }) {
    return this.#getReflector(options).isAbstract(type)
  }

  isKnown(type, options = { }) {
    options.excludeKnown = true
    return this.#getReflector(options).isKnown(type, options)
  }
  isKnownKey(type, name, options = { }) {
    options.excludeKnown = true
    return this.#getReflector(options).isKnownKey(type, name, options)
  }

  hasOwnKey(type, name, options = { }) {
    return this.#getReflector(options).hasOwnKey(type, name, options)
  }
  *ownKeys(type, options = { }) {
    yield* this.#getReflector(options).ownKeys(type, options)
  }
  *keys(type, options = { }) {
    yield* this.#getReflector(options).keys(type, options)
  }
  isHostOf(type, name, options = { }) {
    return this.#getReflector(options).isHostOf(type, name, options)
  }
  *getHosts(type, name, options = { }) {
    yield* this.#getReflector(options).getHosts(type, name, options)
  }
  getOwnDescriptor(type, name, options = { }) {
    return this.#getReflector(options).getOwnDescriptor(type, name, options)
  }
  *ownDescriptors(type, options = { }) {
    yield* this.#getReflector(options).ownDescriptors(type, options)
  }

  *getDescriptor(type, name, options = { }) {
    yield* this.#getReflector(options).getDescriptor(type, name, options)
  }
  *descriptors(type, options = { }) {
    yield* this.#getReflector(options).descriptors(type, options)
  }
}

export const Es6Reflect = new Es6LegacyReflect()
