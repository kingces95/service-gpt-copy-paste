import { 
  PartialType, 
  PartialTypeReflect,
  Thunk, Preconditions, Postconditions,
  TypePrecondition, TypePostcondition,
  Prototype, Constructors
} from '@kingjs/partial-type'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { 
  getPrototype as getPartialPrototype 
} from '@kingjs/partial-prototype'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor', Constructors ]
const KnownStaticKeys = [ 'length', 'name', 'prototype',
  Thunk, Preconditions, Postconditions,
  TypePrecondition, TypePostcondition,
  Prototype,
  // TODO: remove Compile, Declarations, Symbol.hasInstance
  PartialType.Compile, 'Compile',
  PartialType.Declarations, 'Declarations',
  Symbol.hasInstance,
]

export class PartialReflector {
  #es6UserReflector
  #partialReflector

  constructor() {
    this.#es6UserReflector = new Es6Reflector({
      knownTypes: KnownTypes,
      knownInstanceKeys: KnownInstanceKeys,
      knownStaticKeys: KnownStaticKeys,
    })
    
    this.#partialReflector = new Es6Reflector({
      knownTypes: KnownTypes,
      knownInstanceKeys: KnownInstanceKeys,
      knownStaticKeys: KnownStaticKeys,
      getPrototypeFn: type => getPartialPrototype(type),
    })
  }

  #reflector(type) { 
    const isPartialType = PartialTypeReflect.isPartialType(type)
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
    yield* this.#reflector(isStatic).knownKeys({ isStatic }) 
  }

  getPrototype(type, { isStatic } = { }) {
    return this.#reflector(type).getPrototype(type, { isStatic })
  }
  *hierarchy(type) { 
    yield* this.#reflector(type).hierarchy(type) 
  }
  getBaseType(type) {
    return this.#reflector(type).getBaseType(type)
  }
  *baseTypes(type) { 
    yield* this.#reflector(type).baseTypes(type) 
  }
  isExtensionOf(type, targetType) { 
    return this.#reflector(type).isExtensionOf(type, targetType) 
  }
  isAbstract(type) { 
    return this.#reflector(type).isAbstract(type) 
  }
  isKnown(type, { isStatic } = { }) {
    return this.#reflector(type, isStatic).isKnown(type, { isStatic })
  }
  isKnownKey(type, name, { isStatic } = { }) {
    return this.#reflector(type, isStatic).isKnownKey(type, name, { isStatic })
  }
  hasOwnKey(type, name, { isStatic } = { }) {
    return this.#reflector(type, isStatic).hasOwnKey(type, name, { isStatic })
  }
  *ownKeys(type, { isStatic } = { }) {
    yield* this.#reflector(type, isStatic).ownKeys(type, { isStatic })
  }
  *keys(type, { isStatic, includeOverridden } = { }) {
    yield* this.#reflector(type, isStatic).keys(type, { 
      isStatic, includeOverridden })
  }
  isHostOf(type, name, { isStatic } = { }) {
    return this.#reflector(type, isStatic).isHostOf(type, name, { isStatic })
  }
  *hosts(type, name, { isStatic } = { }) {
    yield* this.#reflector(type, isStatic).hosts(type, name, { isStatic })
  }
  getImplementingHost(type, name, { isStatic } = { }) {
    return this.#reflector(type, isStatic).getImplementingHost(type, name, { isStatic })
  }
  getOwnDescriptor(type, name, { isStatic } = { }) {
    return this.#reflector(type, isStatic).getOwnDescriptor(type, name, { isStatic })
  }
  *ownDescriptors(type, { isStatic } = { }) {
    yield* this.#reflector(type, isStatic).ownDescriptors(type, { isStatic })
  }
  *getDescriptor(type, name, { isStatic } = { }) {
    yield* this.#reflector(type, isStatic).getDescriptor(type, name, { isStatic })
  }
  *descriptors(type, { isStatic, includeOverridden } = { }) {
    yield* this.#reflector(type, isStatic).descriptors(type, { 
      isStatic, includeOverridden })
  }
}