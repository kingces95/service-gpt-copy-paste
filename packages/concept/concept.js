import { abstractify } from '@kingjs/abstract'
import { PartialType, Declarations, Compile } from '@kingjs/partial-type'
import { PartialClass } from '@kingjs/partial-class'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialMetadata } from '@kingjs/partial-reflect'
import { Implements, Transparent } from '@kingjs/partial-symbols'

export { Implements } from '@kingjs/partial-symbols'

export class Concept extends PartialType {
  static [Declarations] = {
    ...PartialClass[Declarations],
    [Implements]: { expectedType: Concept },
  }

  // Concept is an abstract type (i.e. it cannot be instantiated) so 
  // the default instanceof behavior is would always be false. This 
  // fact justifies overriding Symbol.hasInstance to provide an 
  // alternative behavior which is to test if an instance satisfies 
  // a concept. A concept is satisified if (1) the instance can be 
  // duck cast to MyConcept and (2) the instance satisfies all 
  // associated concepts of MyConcept.
  static [Symbol.hasInstance](instance) {
    if (this == Concept) 
      return false

    if (typeof instance != 'object' || instance == null) 
      return false

    if (!satisfiesAssociations(this, instance)) 
      return false

    return Es6Reflect.canDuckCast(this, instance)
  }

  static [Compile](descriptor) {
    const compiledDescriptor = super[Compile](descriptor)
    const abstractDescriptor = abstractify(compiledDescriptor)
    return abstractDescriptor
  }
}

// TODO: Remove/combine with Concept or extend with Symbol.hasInstance.
export class ImplicitConcept extends PartialType {
  static [Transparent] = true
  static [Compile](descriptor) {
    const compiledDescriptor = super[Compile](descriptor)
    const abstractDescriptor = abstractify(compiledDescriptor)
    return abstractDescriptor
  }
}

// Associated concepts allow for testing if assoicated metadata of
// an instance satisfies associated metadata of a concept. 
// For example, 

  // myContainer instanceof InputContainerConcept

// where MyContainer declares an anassociated cursorType as an
// InputCursor like,

  // static cursorType = InputCursor

// and InputContainerConcept declares an associated concept 
// cursorType as InputCursorConcept like,

  // static cursorType = InputCursorConcept

// would be true because InputCursor satisfies InputCursorConcept.
function satisfiesAssociations(concept, instance) {
  const ctor = instance.constructor

  for (const { value: associatedConcept, key } of PartialMetadata.values(
    concept, { extensionOf: Concept, includeOverridden: true })) {

    const associatedType = ctor[key]
    if (!(typeof associatedType == 'function')) 
      return false      
    
    if (!(associatedType.prototype instanceof associatedConcept)) 
      return false        
  }
  return true
}
