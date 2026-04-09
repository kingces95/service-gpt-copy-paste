import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Reflector } from '@kingjs/es6-reflector'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialType } from '@kingjs/partial-type'
import { 
  Implements, 
  Extends,
  Compile,
  Declarations,
  Thunk, 
  Preconditions, 
  Postconditions,
  TypePrecondition, 
  TypePostcondition,
} from '@kingjs/partial-symbols'

// Unfies reflection operations over PartialType and Es6 types which
// may have been merged with vairous PartialTypes (i.e.PartialClass,
// Concept, etc.). For example, 

// *PartialReflect.baseTypes(type)
//    Returns the base types of a type. Since a type may have multiple base
//    types they are returned in the reverse order they were merged.
//    For example, if a type extends a base type and a concept, baseTypes 
//    will return the Concept followed by the base type.  

// *PartialReflect.keys(type, { includeOverridden })
//    Returns all keys of a type including keys of PartialTypes and Es6 types. 
//    If includeOverridden is false, overridden keys are not included. If
//    includeOverridden is true, overridden keys are included and associated
//    with the type that defined them (i.e. hosts).

// *PartialReflect.hosts(type, key)
//    Returns all types that defined or were overridden defining a member 
//    with the key.

// etc.

const KnownTypes = [ Object, Function, PartialType ]
const KnownKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype',
  Implements, Extends,
  Thunk, 
  Preconditions, Postconditions,
  TypePrecondition, TypePostcondition,
  // TODO: remove Compile, Declarations, Symbol.hasInstance
  Compile, 'Compile',
  Declarations, 'Declarations',
  Symbol.hasInstance,
]

// METADATA

// PartialReflector supports metadata which is a prototype chain of the 
// static field descriptors of a type found by traversing the type
// hiearchy of the instance prototype chain. For example, implementing

  //  myContainer instanceof InputContainerConcept
  
// where MyContainer declares an an associated cursorType as an
// InputCursor like,

  //  class InputCursorConcept extends Concept { 
  //    next() { }
  //    get value() { } 
  //  }
  //  class InputContainerConcept extends Concept { 
  //    static cursorType = InputCursorConcept 
  //  }  

  //  class MyCursor exends Cursor {
  //    static { extends(this, InputCursorConcept) }
  //    next() {...}
  //    get value() {...} 
  //  }
  //  class MyPartialContainer extends PartialClass {
  //    static cursorType = MyCursor
  //    ...
  //  }
  //  class MyContainer extends Container { 
  //    static { extends(this, MyPartialContainer) }
  //    // the following members included for illustrative purposes only.
  //    static myStaticField = ...
  //    myMember() {...}
  //  }

// requires testing if MyContainer's cursor is an InputCurosr. Specifically,
// this requires testing if MyContainer has a static cursorType whose value
// is a type an instance of which would be instanceof the concept found 
// in the static cursorType on InputContainerConcept namely 
// InputCursorConcept. 

// A naive implementation would search the static prototype chain created
// by Es6Reflector for a field named cursorType on MyContainer and find none. 

  // Es6Reflector Static Prototype Chain:

  // MyContainer (myStaticField)
  // └── Container
  //     └── Object
  //         └── null

// The correct implementation would search for a static named cursorType on 
// all partial extensions as well (i.e. on MyPartialContainer). Metadata 
// solves this by allowing querying across the partial extensions for static 
// field descriptors using the following transform.

// PartialReflector creates an instance prototype chain for MyContainer
// which includes the partial types defined on MyContainer:

  // PartialReflector Instance Prototype Chain:

  // MyContainer (myMember)
  // └── MyPartialContainer
  //     └── Container
  //         └── Object
  //             └── null

// Each prototype in this chain has a copy of the instance descriptors of
// the type it represents. The metadata chain is a transformation of this 
// instance prototype chain except that each prototype in the chain has a 
// copy of the *static field* descriptors of the type it represents. 

  // PartialReflector Metadata Prototype Chain:

  // MyContainer (myStaticField)
  // └── MyPartialContainer (cursorType)
  //     └── Container
  //         └── Object
  //             └── null

// Querying the metadata chain for MyContainer would hence find the static 
// cursorType on MyPartialContainer.

// PRECONDITIONS AND POSTCONDITIONS

// PartialReflector also supports preconditions and postconditions which are
// prototypes chains of the function descriptors of a type found by traversing
// the type hierarchy of the metadata prototype chain. 

// Continuing the above example, if MyCursor, InputCursorConcept and Cursor 
// defined preconditions like,

  //  MyCursor[Preconditions] = {
  //    next() { ...precondition... }
  //  }

  //  Cursor[Preconditions] = {
  //    value() { ...precondition... }
  //  }

  //  InputCursorConcept[Preconditions] = {
  //    value() { ...precondition... }
  //    next() { ...precondition... }
  //  }

// then the metadata prototype chain of MyCursor would be like,

  // MyCursor (Preconditions)
  // └── InputCursorConcept (Preconditions)
  //     └── Cursor (Preconditions)
  //         └── Object
  //             └── null

// which is transformed into a preconditions chain by expanding the 
// Preconditions POJOs into a chain like,

  // MyCursor (next)
  // └── InputCursorConcept (value, next)
  //     └── Cursor (value)
  //         └── null

// Querying the preconditions chain for MyCursor for precondition by name
// would yield descriptors for all relevant preconditions. For example, 
// querying for the next precondition would yield the next preconditions 
// on MyCursor and InputCursorConcept but not Cursor since Cursor does 
// not define a next precondition. 

export class PartialReflector extends Es6Reflector {
  constructor() {
    super({
      knownTypes: KnownTypes, 
      knownTypeFn: type => Object.getPrototypeOf(type) === PartialType,
      knownKeys: KnownKeys,
      knownStaticKeys: KnownStaticKeys,
      // TODO: suppress caching transparent prototypes?
      getPrototypeFn: function createPrototype(type) {
        const hierarchy = [...PartialLoader.hierarchy(type)]
        
        return hierarchy.reduce((prototype, currentType) => {
          const descriptors = { }

          let ownKey
          for (const current of PartialLoader.ownDescriptors(currentType)) {
            assert(typeof current == 'object'
              || typeof current == 'string' 
              || typeof current == 'symbol',
              `Unexpected type: ${typeof current}`)

            switch (typeof current) {
              case 'string':
              case 'symbol':
                ownKey = current 
              break
              case 'object':
                // inherit existing descriptor if current is abstract
                if (isAbstract(current)) {
                  const existing = descriptors[ownKey]
                  if (existing && !isAbstract(existing))
                    current = existing
                }
                descriptors[ownKey] = current
                break
            }
          }

          return Es6Prototype.createLink(currentType, prototype, descriptors)
        }, null)
      },
    })
  }

  *getPreconditions(type, key) {
    yield *this.getMetadataPrototype(type, Preconditions)
      .getDescriptor(type, key)
  }
  *getPostconditions(type, key) {
    yield *this.getMetadataPrototype(type, Postconditions)
      .getDescriptor(type, key)
  } 
}
