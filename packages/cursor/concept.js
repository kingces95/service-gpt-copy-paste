import { getOwn } from '@kingjs/get-own'
import { 
  getPropertyDescriptor, 
  getPropertyNames 
} from './get-property-descriptor.js'
import { Preconditions } from './debug-proxy.js'

// Concepts are like C# interfaces or STL concepts with a twist. A concept 
// is a javascript class that defines a set of methods and properties. A
// class satisfies a concept if it has all the methods and properties defined
// by the concept. The twist is that the class will "implement" the concept
// in its static constructor which will, for each method and property, attach
// the concept's member to the class prototype if it does not already exist.
// `myInstance instanceof myConcept` tests if an instance satsifies a concept.

export const Dispatch = Symbol('Dispatch')

export class Concept { 
  static [Preconditions] = class { }
  
  static [Symbol.hasInstance](instance) {
    const constructor = instance?.constructor
    if (!constructor) return false
    return conceptOf(constructor, this)  
  }

  [Dispatch](concept, name, ...args) {
    throw new Error('Not implemented.')
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
  const typeNames = getPropertyNames(typePrototype)

  initializeCaches(type)

  for (const concept of concepts) {
    // if the concept is already implemented, skip it
    if (type[ConceptHitCache].has(concept)) continue

    // copy the concept's descriptors to the type prototype
    const conceptPrototype = concept.prototype
    for (const name of getPropertyNames(conceptPrototype)) {
      if (name === 'constructor') continue
      if (!typeNames.includes(name)) {
        Object.defineProperty(typePrototype, name, 
          getPropertyDescriptor(conceptPrototype, name))
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

  for (const name of getPropertyNames(conceptPrototype)) {
    if (name === 'constructor') continue

    const typeDescriptor = getPropertyDescriptor(typePrototype, name)
    if (!typeDescriptor) return false
    if (isDataDescriptor(typeDescriptor)) continue

    const conceptDescriptor = getPropertyDescriptor(conceptPrototype, name)
    if (conceptDescriptor.get && !typeDescriptor.get) return false
    if (conceptDescriptor.set && !typeDescriptor.set) return false
  }

  return true
}
