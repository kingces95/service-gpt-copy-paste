import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { Es6Reflector } from '@kingjs/es6-reflector'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype' ]

export class PartialReflector {
  #es6UserReflector
  #partialReflector

  constructor({
  } = { }) {
    this.#es6UserReflector = Es6UserReflect
    this.#partialReflector = new Es6Reflector({
      knownTypes: KnownTypes,
      knownInstanceKeys: KnownInstanceKeys,
      knownStaticKeys: KnownStaticKeys,
      getPrototypeFn: type => type.prototype,
    })
  }

  #reflector(isPartialType = false) { 
    return isPartialType
      ? this.#partialReflector
      : this.#es6UserReflector 
  }

  typeof(type, key, descriptor) {
    return this.#reflector().typeof(type, key, descriptor)
  }

  *knownTypes() { 
    yield* this.#reflector().knownTypes()
  }
  *knownKeys({ isStatic } = { }) { 
    yield* this.#reflector(isStatic).knownKeys() 
  }

  *hierarchy(type) { 
    yield* this.#reflector().hierarchy(type) 
  }
  getBaseType(type) {
    return this.#reflector().getBaseType(type)
  }
  *baseTypes(type) { 
    yield* this.#reflector().baseTypes(type) 
  }
  isExtensionOf(type, targetType) { 
    return this.#reflector().isExtensionOf(type, targetType) 
  }
  isAbstract(type) { 
    return this.#reflector().isAbstract(type) 
  }
  isKnown(type, { isStatic } = { }) {
    return this.#reflector(isStatic).isKnown(type)
  }
  isKnownKey(type, name, { isStatic } = { }) {
    return this.#reflector(isStatic).isKnownKey(type, name)
  }
  hasOwnKey(type, name, { isStatic } = { }) {
    return this.#reflector(isStatic).hasOwnKey(type, name)
  }
  *ownKeys(type, { isStatic } = { }) {
    yield* this.#reflector(isStatic).ownKeys(type)
  }
  *keys(type, { isStatic } = { }) {
    yield* this.#reflector(isStatic).keys(type)
  }
  isHostOf(type, name, { isStatic } = { }) {
    return this.#reflector(isStatic).isHostOf(type, name)
  }
  *getHosts(type, name, { isStatic } = { }) {
    yield* this.#reflector(isStatic).getHosts(type, name)
  }
  getOwnDescriptor(type, name, { isStatic } = { }) {
    return this.#reflector(isStatic).getOwnDescriptor(type, name)
  }
  *ownDescriptors(type, { isStatic } = { }) {
    yield* this.#reflector(isStatic).ownDescriptors(type)
  }
  *getDescriptor(type, name, { isStatic } = { }) {
    yield* this.#reflector(isStatic).getDescriptor(type, name)
  }
  *descriptors(type, { isStatic } = { }) {
    yield* this.#reflector(isStatic).descriptors(type)
  }
}
