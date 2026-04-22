import { abstractify } from '@kingjs/abstract'
import { PartialType } from '@kingjs/partial-type'
import { Attachments } from '../partial-attachments'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialMetadata } from '@kingjs/partial-metadata'
import { 
  Declarations,
  Defines, 
  Implements, 
  Compile 
} from '@kingjs/partial-symbols'

export { Defines, Implements } from '@kingjs/partial-symbols'

export class Concept extends PartialType {
  static [Declarations] = {
    [Defines]: Attachments,
    [Implements]: Concept,
  }

  // The default instanceof behavior would always be false because
  // Concept is an abstract type in that Concept is a pure metadata 
  // construct so should never be instantiated so no instance would
  // ever exist. This fact justifies overriding Symbol.hasInstance 
  // to provide an alternative behavior which is to test if an instance 
  // satisfies a concept. A concept is satisified if 

  //    (1) the instance can be duck cast to MyConcept
  //    (2) the instance satisfies all associated concepts of MyConcept.
  
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
    
    // pipeline
    descriptor = super[Compile](descriptor)
    descriptor = abstractify(descriptor)
    return descriptor
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
