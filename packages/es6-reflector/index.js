import { assert } from '@kingjs/assert'
import {
  Es6Prototype,
  Es6StaticPrototype,
} from '@kingjs/es6-prototype'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

export class Es6Reflector {
  #instance
  #static

  constructor({
    knownTypes,
    knownInstanceKeys,
    knownStaticKeys,
    getPrototypeFn = type => type.prototype,
  } = { }) {
    this.#instance = new Es6Prototype({
      knownTypes,
      knownKeys: knownInstanceKeys,
      getPrototypeFn,
    })

    this.#static = new Es6StaticPrototype({
      knownTypes,
      knownKeys: knownStaticKeys,
    })
  }

  #reflect(isStatic = false) { 
    return isStatic ? this.#static : this.#instance 
  }

  // static/instance agnostic methods
  *knownTypes() { 
    yield* this.#instance.knownTypes()
  }

  // static exclusive methods
  isExtensionOf(type, targetType, { minDepth = 1 } = { }) {
    if (!type) return false
    if (typeof type != 'function') return false
    
    let depth = 0
    for (const base of this.#static.hierarchy(type)) {
      if (base == targetType) return depth >= minDepth
      depth++
    }

    return false
  }
  getExtendedType(type) {
    return this.#static.getBaseType(type)
  }
  isAbstract(type) {
    return type != Object && !this.isExtensionOf(type, Object)
  }

  // instance exclusive methods
  *hierarchy(type) { 
    yield* this.#instance.hierarchy(type) 
  }
  getBaseType(type) {
    return this.#instance.getBaseType(type)
  }
  *baseTypes(type) { 
    yield* this.#instance.baseTypes(type) 
  }
  canDuckCast(type, targetType) {
    return this.#instance.canDuckCast(type, targetType)
  }

  // shared methods
  typeof(type, key, descriptor, { isStatic } = { }) {
    const descriptorType = Es6Descriptor.typeof(descriptor)
    if (descriptorType != 'field')
      return descriptorType

    const value = descriptor.value
    const es6Type = es6Typeof(value)
    if (!isStatic && key === 'constructor' && value === type) {
      assert(es6Type == 'class')
      return 'constructor'
    }

    return 'field'
  }
  getPrototype(type, { isStatic } = { }) {
    return this.#reflect(isStatic).getPrototype(type)
  }
  isKnown(type, { isStatic } = { }) {
    return this.#reflect(isStatic).isKnown(type)
  }
  *knownKeys({ isStatic } = { }) { 
    yield* this.#reflect(isStatic).knownKeys() 
  }
  isKnownKey(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).isKnownKey(type, name)
  }
  hasOwnKey(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).hasOwnKey(type, name)
  }
  hasKey(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).hasKey(type, name)
  }
  *ownKeys(type, { isStatic } = { }) {
    yield* this.#reflect(isStatic).ownKeys(type)
  }
  *keys(type, { isStatic, includeOverridden } = { }) {
    yield* this.#reflect(isStatic).keys(type, { includeOverridden })
  }
  *ownHosts(type, name, { isStatic } = { }) {
    yield* this.#reflect(isStatic).ownHosts(type, name)
  }
  *hosts(type, name, { isStatic } = { }) {
    yield* this.#reflect(isStatic).hosts(type, name)
  }
  getImplementingHost(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).getImplementingHost(type, name)
  }
  getOwnDescriptor(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).getOwnDescriptor(type, name)
  }
  *ownDescriptors(type, { isStatic } = { }) {
    yield* this.#reflect(isStatic).ownDescriptors(type)
  }
  *getDescriptor(type, name, { isStatic } = { }) {
    yield* this.#reflect(isStatic).getDescriptor(type, name)
  }
  *descriptors(type, { isStatic, includeOverridden } = { }) {
    yield* this.#reflect(isStatic).descriptors(type, { includeOverridden })
  }
}
