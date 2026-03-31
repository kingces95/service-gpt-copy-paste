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
    getPrototypeFn = type => type.prototype,
  } = { }) {
    this.#instancePrototype = new Es6InstancePrototype({
      knownTypes,
      knownKeys: knownInstanceKeys,
      getPrototypeFn,
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

  getPrototype(type, { isStatic } = { }) {
    return this.#prototype(isStatic).getPrototype(type)
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
  getExtendedType(type) {
    return this.#prototype().getExtendedType(type)
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
  *keys(type, { isStatic, includeOverridden } = { }) {
    yield* this.#prototype(isStatic).keys(type, { includeOverridden })
  }
  isHostOf(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).isHostOf(type, name)
  }
  *hosts(type, name, { isStatic } = { }) {
    yield* this.#prototype(isStatic).hosts(type, name)
  }
  getImplementingHost(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).getImplementingHost(type, name)
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
  *descriptors(type, { isStatic, includeOverridden } = { }) {
    yield* this.#prototype(isStatic).descriptors(type, { includeOverridden })
  }
}
