import {
  Es6InstancePrototype,
  Es6StaticPrototype,
} from '@kingjs/es6-prototype'

export class Es6Reflector {
  #instancePrototype
  #staticPrototype

  constructor({
    knownTypes,
    knownInstanceKeys,
    knownStaticKeys,
  } = { }) {
    this.#instancePrototype = new Es6InstancePrototype({
      knownTypes,
      knownKeys: knownInstanceKeys,
    })

    this.#staticPrototype = new Es6StaticPrototype({
      knownTypes,
      knownKeys: knownStaticKeys,
    })
  }

  #prototype(isStatic = false) { 
    return isStatic
      ? this.#staticPrototype
      : this.#instancePrototype 
  }

  typeof(type, key, descriptor) {
    return this.#prototype().typeof(type, key, descriptor)
  }

  *knownTypes() { 
    yield* this.#prototype().knownTypes()
  }
  *knownKeys({ isStatic } = { }) { 
    yield* this.#prototype(isStatic).knownKeys() 
  }

  *hierarchy(type) { 
    yield* this.#prototype().hierarchy(type) 
  }
  getBaseType(type) {
    return this.#prototype().getBaseType(type)
  }
  *baseTypes(type) { 
    yield* this.#prototype().baseTypes(type) 
  }
  isExtensionOf(type, targetType) { 
    return this.#prototype().isExtensionOf(type, targetType) 
  }
  isAbstract(type) { 
    return this.#prototype().isAbstract(type) 
  }
  isKnown(type, { isStatic } = { }) {
    return this.#prototype(isStatic).isKnown(type)
  }
  isKnownKey(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).isKnownKey(type, name)
  }
  hasOwnKey(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).hasOwnKey(type, name)
  }
  *ownKeys(type, { isStatic } = { }) {
    yield* this.#prototype(isStatic).ownKeys(type)
  }
  *keys(type, { isStatic } = { }) {
    yield* this.#prototype(isStatic).keys(type)
  }
  isHostOf(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).isHostOf(type, name)
  }
  *getHosts(type, name, { isStatic } = { }) {
    yield* this.#prototype(isStatic).getHosts(type, name)
  }
  getOwnDescriptor(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).getOwnDescriptor(type, name)
  }
  *ownDescriptors(type, { isStatic } = { }) {
    yield* this.#prototype(isStatic).ownDescriptors(type)
  }
  *getDescriptor(type, name, { isStatic } = { }) {
    yield* this.#prototype(isStatic).getDescriptor(type, name)
  }
  *descriptors(type, { isStatic } = { }) {
    yield* this.#prototype(isStatic).descriptors(type)
  }
}

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'constructor', 'length', 'name', 'prototype' ]

export class Es6UserReflector extends Es6Reflector {
  constructor() {
    super({
      knownTypes: KnownTypes,
      knownInstanceKeys: KnownInstanceKeys,
      knownStaticKeys: KnownStaticKeys,
    })
  }
}

export class Es6Reflect$ {
  #userReflector
  #legacyReflector
  #reflector

  constructor() {
    this.#userReflector = new Es6UserReflector()
    this.#legacyReflector = new Es6Reflector({
      knownTypes: [ Object ]
    })
    this.#reflector = new Es6Reflector()
  }

  // #getReflector({ excludeKnown } = { }) {
  //   return excludeKnown ? this.#userReflector : this.#legacyReflector
  // }
  #getReflector(type, options = { }) {
    return this.#getReflector$(type, options)
  }

  typeof(type, key, descriptor, options = { }) {
    return this.#getReflector(type, options).typeof(type, key, descriptor)
  }
  *hierarchy(type, options = { }) {
    yield* this.#getReflector(type, options).hierarchy(type)
  }
  getBaseType(type, options = { }) {
    return this.#getReflector(type, options).getBaseType(type)
  }
  *baseTypes(type, options = { }) {
    yield* this.#getReflector(type, options).baseTypes(type)
  }
  isExtensionOf(type, targetType, options = { }) {
    return this.#getReflector(type, options).isExtensionOf(type, targetType)
  }
  isAbstract(type, options = { }) {
    return this.#getReflector(type, options).isAbstract(type)
  }
  isKnown(type, options = { }) {
    return this.#getReflector(type, options).isKnown(type, options)
  }
  isKnownKey(type, name, options = { }) {
    return this.#getReflector(type, options).isKnownKey(type, name, options)
  }
  hasOwnKey(type, name, options = { }) {
    return this.#getReflector(type, options).hasOwnKey(type, name, options)
  }
  *ownKeys(type, options = { }) {
    yield* this.#getReflector(type, options).ownKeys(type, options)
  }
  *keys(type, options = { }) {
    yield* this.#getReflector(type, options).keys(type, options)
  }
  isHostOf(type, name, options = { }) {
    return this.#getReflector(type, options).isHostOf(type, name, options)
  }
  *getHosts(type, name, options = { }) {
    yield* this.#getReflector(type, options).getHosts(type, name, options)
  }
  getOwnDescriptor(type, name, options = { }) {
    return this.#getReflector(type, options).getOwnDescriptor(type, name, options)
  }
  *ownDescriptors(type, options = { }) {
    yield* this.#getReflector(type, options).ownDescriptors(type, options)
  }

  #getReflector$(type, { excludeKnown, isStatic } = { }) {
    return excludeKnown 
      ? this.#userReflector 
      : isStatic && type != Object
        ? this.#legacyReflector
        : this.#reflector
  }
  *getDescriptor(type, name, options = { }) {
    yield* this.#getReflector$(type, options).getDescriptor(type, name, options)
  }
  *descriptors(type, options = { }) {
    yield* this.#getReflector$(type, options).descriptors(type, options)
  }
}

