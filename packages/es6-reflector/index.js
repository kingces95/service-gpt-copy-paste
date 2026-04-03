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

  isExtensionOf(type, targetType, { minDepth = 1 } = { }) {
    const prototype = this.#staticPrototype

    if (!type) return false
    if (typeof type != 'function') return false
    
    let depth = 0
    for (const base of prototype.hierarchy(type)) {
      if (base == targetType) return depth >= minDepth
      depth++
    }

    return false
  }

  getExtendedType(type) {
    const prototype = this.#staticPrototype

    let result = Object.getPrototypeOf(type)
    if (result == Function.prototype) 
      result = Object

    for (const base of prototype.baseTypes(type))
      if (base == result) return base
    return null
  }

  isAbstract(type) {
    return type != Object && !this.isExtensionOf(type, Object)
  }

  typeof(type, key, descriptor) {
    return this.#instancePrototype.typeof(type, key, descriptor)
  }

  *knownTypes() { 
    yield* this.#instancePrototype.knownTypes()
  }

  *hierarchy(type) { 
    yield* this.#instancePrototype.hierarchy(type) 
  }
  getBaseType(type) {
    return this.#instancePrototype.getBaseType(type)
  }
  *baseTypes(type) { 
    yield* this.#instancePrototype.baseTypes(type) 
  }
  canDuckCast(type, targetType) {
    return this.#instancePrototype.canDuckCast(type, targetType)
  }

  getPrototype(type, { isStatic } = { }) {
    return this.#prototype(isStatic).getPrototype(type)
  }
  isKnown(type, { isStatic } = { }) {
    return this.#prototype(isStatic).isKnown(type)
  }
  *knownKeys({ isStatic } = { }) { 
    yield* this.#prototype(isStatic).knownKeys() 
  }
  isKnownKey(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).isKnownKey(type, name)
  }
  hasOwnKey(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).hasOwnKey(type, name)
  }
  hasKey(type, name, { isStatic } = { }) {
    return this.#prototype(isStatic).hasKey(type, name)
  }
  *ownKeys(type, { isStatic } = { }) {
    yield* this.#prototype(isStatic).ownKeys(type)
  }
  *keys(type, { isStatic, includeOverridden } = { }) {
    yield* this.#prototype(isStatic).keys(type, { includeOverridden })
  }
  *ownHosts(type, name, { isStatic } = { }) {
    yield* this.#prototype(isStatic).ownHosts(type, name)
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
