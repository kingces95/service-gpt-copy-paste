import { getOwn } from '@kingjs/get-own'
import { Reflection } from '@kingjs/reflection'

const {
  namesAndSymbols
} = Reflection

// Concepts are like C# interfaces or STL concepts with a twist. A concept 
// is a javascript class that defines a set of methods and properties. A
// class satisfies a concept if it has all the methods and properties defined
// by the concept. The twist is that the class will "implement" the concept
// in its static constructor which will, for each method and property, attach
// the concept's member to the class prototype if it does not already exist.
// `myInstance instanceof myConcept` tests if an instance satsifies a concept.

export const Stub = Symbol('Stub')
export const Bind = Symbol('Bind')

export class Concept { 
  static [Symbol.hasInstance](instance) {
    const constructor = instance?.constructor
    if (!constructor) return false
    return conceptOf(constructor, this)  
  }

  [Bind](concept, name) {
    throw new Error('Not implemented.')
  }
  [Stub](concept, name, ...args) {

    // dynamically bind the function
    const fn = this[Bind](concept, name)
    if (typeof fn !== 'function') throw new TypeError(
      `Concept ${concept.name} failed to bind ${name}.`)

    // backpatch the prototype where name is defined
    let prototype = this
    while (prototype = Object.getPrototypeOf(prototype)) {
      if (!prototype.hasOwnProperty(name)) continue
      prototype[name] = fn
      break
    }

    // invoked backpatched method
    const result = this[name](...args)
    return result
  }
}

// Map caches of concept hits and misses
const ConceptHitCache = Symbol('ConceptCache')
const ConceptMissCache = Symbol('ConceptCache')

// For each of the enumerable property descriptors of each of the 
// concept prototypes, copy the descriptor to the type prototype.
// If the property already exists on the type prototype, it is not 
// copied. The 'constructor' property is not copied.
export function implement(type, ...concepts) {
  const typePrototype = type.prototype
  const typeNames = new Set(namesAndSymbols(typePrototype))

  initializeCaches(type)

  for (const concept of concepts) {
    // if the concept is already implemented, skip it
    if (type[ConceptHitCache].has(concept)) continue

    // copy the concept's descriptors to the type prototype
    const conceptPrototype = concept.prototype
    for (const name of namesAndSymbols(conceptPrototype)) {
      if (name === 'constructor') continue
      if (!typeNames.has(name)) {
        Object.defineProperty(typePrototype, name, 
          Reflection.getDescriptor(conceptPrototype, name))
      }
    }

    // update the cache
    type[ConceptHitCache].add(concept)
  }
}

export function conceptOf(type, concept) {
  // activate the caches
  initializeCaches(type)

  // check the caches first
  if (type[ConceptHitCache].has(concept)) return true
  if (type[ConceptMissCache].has(concept)) return false

  const result = conceptOf$(type, concept)

  // update the caches
  if (result) {
    type[ConceptHitCache].add(concept)
  } else {
    type[ConceptMissCache].add(concept)
  }

  return result
}

function initializeCaches(type) {
  if (!getOwn(type, ConceptHitCache)) type[ConceptHitCache] = new Set()
  if (!getOwn(type, ConceptMissCache)) type[ConceptMissCache] = new Set()
}

function isDataDescriptor(descriptor) {
  if (!descriptor) return false
  return descriptor.hasOwnProperty('value') || 
         descriptor.hasOwnProperty('writable')
}

function conceptOf$(type, concept) {
  const typePrototype = type.prototype
  const conceptPrototype = concept.prototype

  for (const name of Reflection.names(conceptPrototype)) {
    if (name === 'constructor') continue

    const typeDescriptor = Reflection.getDescriptor(typePrototype, name)
    if (!typeDescriptor) return false
    if (isDataDescriptor(typeDescriptor)) continue

    const conceptDescriptor = Reflection.getDescriptor(conceptPrototype, name)
    if (conceptDescriptor.get && !typeDescriptor.get) return false
    if (conceptDescriptor.set && !typeDescriptor.set) return false
  }

  return true
}
