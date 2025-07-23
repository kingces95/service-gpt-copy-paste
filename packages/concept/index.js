import { Reflection } from '@kingjs/reflection'
import { PartialClass, Bind } from '@kingjs/partial-class'

const {
  names,
  getDescriptor,
  isDataDescriptor,
  toDescriptor,
} = Reflection


// Concept allows types to define how they conform, while PartialClass defines 
// what it means to have behavior.

// Concepts are like C# interfaces or STL concepts with a twist. A concept 
// is a javascript class that defines a set of methods and properties. A
// class satisfies a concept if it has all the methods and properties defined
// by the concept. 

// The twist from an C# interface or STL concept is that implementing a concept
// on a type (in its static block using `implement(type, concept)`) will trigger
// a callback if a concept member is missing which will return a descriptor
// that can be used to define the member on the type prototype. So the concept
// can be used to both test for methods and to attach methods to a type.

export const Test = Symbol('Test')

export class Concept extends PartialClass { 
  // `myInstance instanceof myConcept` tests if an instance satsifies a concept.
  static [Symbol.hasInstance](instance) {
    const constructor = instance?.constructor
    if (!constructor) return false
    
    // if concept exposes procedural test by exposing a static Test method,
    // then call it to test if the instance satisfies the concept.
    // For example, ReversibleContainerConcept has a static Test method
    // that tests if the instance .cusorType is a BidirectionalCursorConcept. 
    if (this[Test] && !this[Test].call(instance)) return false

    return conceptOf(constructor, this)  
  }

  // delegate to the target type to bind the concept member to a descriptor
  // given the concept and the member name. Allow the target type to return
  // a partial descriptor whose defaults will be assigned here.
  static [Bind](type, concept, name, descriptor) {
    if (typeof type[Bind] !== 'function') throw new Error(
      `Type ${type.name} failed to bind "${concept.name}.${name}".`)

    return toDescriptor(type[Bind](concept, name))
  }
}

export function conceptOf(type, concept) {
  const typePrototype = type.prototype
  const conceptPrototype = concept.prototype

  for (const name of names(conceptPrototype)) {
    if (name === 'constructor') continue

    const typeDescriptor = getDescriptor(typePrototype, name)
    if (!typeDescriptor) return false
    if (isDataDescriptor(typeDescriptor)) continue

    const conceptDescriptor = getDescriptor(conceptPrototype, name)
    if (conceptDescriptor.get && !typeDescriptor.get) return false
    if (conceptDescriptor.set && !typeDescriptor.set) return false
  }

  return true
}
