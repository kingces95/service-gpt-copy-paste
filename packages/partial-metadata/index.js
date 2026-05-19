import { assert } from '@kingjs/assert'
import { trimPojo } from '@kingjs/pojo-trim'
import { Prototype } from '@kingjs/prototype'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialType } from '@kingjs/partial-type'
import { contract } from '@kingjs/function-contract'
import { 
  Preconditions, 
  Postconditions,
  TypeChecks,
  ThisChecks,
  ArgChecks,
  TypePrecondition, 
  TypePostcondition,
} from '@kingjs/partial-symbols'

// ____________________________________________________________________________
// METADATA

// PartialMetadata supports metadata which is a prototype chain of the 
// static field descriptors of a type found by traversing the type
// hiearchy of the instance prototype chain. For example, implementing

  //  myContainer instanceof InputRangeConcept
  
// where MyContainer declares an an associated cursorType as an
// InputCursor like,

    //  class InputCursorConcept extends Concept { 
    //    step() { }
    //    get value() { } 
    //  }
    //  class InputRangeConcept extends Concept { 
    //    static cursorType = InputCursorConcept 
    //  }  

  //  class MyCursor exends Cursor {
  //    static { extends(this, InputCursorConcept) }
  //    step() {...}
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
// in the static cursorType on InputRangeConcept namely 
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

// Each prototype in this chain has a copy of the _instance_ descriptors of
// the type it represents. The metadata chain is a transformation of this 
// instance prototype chain where each prototype in the chain has a 
// copy of the _static_ descriptors of the type it represents. 

  // PartialMetadata Instance Prototype Chain:

  // MyContainer (myStaticField)
  // └── MyPartialContainer (cursorType)
  //     └── Container
  //         └── Object
  //             └── null

// Querying the metadata chain for MyContainer would hence find the static 
// cursorType on MyPartialContainer.

export const PartialMetadata = PartialReflect.map({
  knownKeys: [ 'constructor' ],
  getPrototype: function(type) {
    const hierarchy = [...this.hierarchy(type)]

    // reverse because prototype chains are created from the bottome up
    // by Prototype.create but hierarchy is returned from the top down. 
    return hierarchy.reverse().reduce((prototype, currentType) => {
      const descriptors = { }

      let key
      const options = { isStatic: true, descriptorType: 'field' }
      for (const current of this.ownDescriptors(currentType, options)) {
        assert(typeof current == 'object'
          || typeof current == 'string' 
          || typeof current == 'symbol',
          `Unexpected type: ${typeof current}`)

        switch (typeof current) {
          case 'string':
          case 'symbol':
            key = current 
            break
          case 'object':
            descriptors[key] = current
            break
        }
      }

      return Prototype.create(currentType, prototype, descriptors)
    }, null)
  }
})

// ____________________________________________________________________________
// ASSOCIATED PARTIAL TYPES

// Associated partial types allow for testing if assoicated metadata of
// an instance satisfies associated metadata of a PartialType. 

export function satisfiesAssociations(ctor, partialType) {
  for (const { value: associatedPartialType, key } of PartialMetadata.values(
    partialType, { extensionOf: PartialType, includeOverridden: true })) {

    const associatedType = ctor[key]
    if (!(typeof associatedType == 'function')) 
      return false      
    
    return PartialReflect.isComposedOf(associatedType, associatedPartialType)
  }
  return true
}

// ____________________________________________________________________________
// PRECONDITIONS AND POSTCONDITIONS

// PartialPreconditions supports preconditions which is a prototype chains of 
// the function descriptors of a type found by traversing the type hierarchy of 
// the metadata prototype chain. 

// Continuing the above example, if MyCursor, InputCursorConcept and Cursor 
// defined preconditions like,

  //  MyCursor[Preconditions] = {
  //    step() { ...precondition... }
  //  }

  //  Cursor[Preconditions] = {
  //    value() { ...precondition... }
  //  }

  //  InputCursorConcept[Preconditions] = {
  //    value() { ...precondition... }
  //    step() { ...precondition... }
  //  }

// then the metadata prototype chain of MyCursor would be like,

  // MyCursor (Preconditions)
  // └── InputCursorConcept (Preconditions)
  //     └── Cursor (Preconditions)
  //         └── Object
  //             └── null

// which is transformed into a preconditions chain by expanding the 
// Preconditions POJOs into a chain like,

  // MyCursor (step)
  // └── InputCursorConcept (value, step)
  //     └── Cursor (value)
  //         └── null

// Querying the preconditions chain for MyCursor for precondition by name
// would yield descriptors for all relevant preconditions. For example, 
// querying for the step precondition would yield the step preconditions 
// on MyCursor and InputCursorConcept but not Cursor since Cursor does 
// not define a step precondition. 

// PartialPostconditions, PartialThisChecks and PartialArgChecks are 
// similarly defined and useful for quering metadata defined use their 
// respective symbols.

function partialReflectOnMetaObject(symbol) {
  return PartialMetadata.map({
    knownKeys: [ 'constructor' ],
    getPrototype: function(type) {
      const values = [...this.getValue(type, symbol)].reverse()

      return values.reduce((prototype, { host, value }) => {
        const descriptors = Object.getOwnPropertyDescriptors(value)
        return Prototype.create(host, prototype, descriptors)
      }, null) ?? Prototype.create(type)
    }
  })
}

export const PartialPreconditions 
  = partialReflectOnMetaObject(Preconditions)

export const PartialPostconditions 
  = partialReflectOnMetaObject(Postconditions)

export const PartialThisChecks
  = partialReflectOnMetaObject(ThisChecks)

export const PartialArgChecks
  = partialReflectOnMetaObject(ArgChecks)

function getTypeConditions(type, symbol) {
  return [...PartialMetadata.getValue(type, symbol, {
    includeOverridden: true,
    reverseHierarchy: true,
    descriptorType: 'field',
    instanceOf: Function,
  }).map(({ value }) => value)]
}

function getTypeChecks(type) {
  return [...PartialMetadata.getValue(type, TypeChecks, {
    includeOverridden: true,
    reverseHierarchy: true,
    descriptorType: 'field',
  }).map(({ value }) => value)]
}

function getMemberConditions(reflect, type, key) {
  const result = {
    value: [],
    get: [],
    set: [],
  }

  for (const current of reflect.getDescriptor(type, key, {
    reverseHierarchy: true,
  })) {
    switch (typeof current) {
      case 'function': break
      case 'object':
        const { get, set, value } = current
        if (get) result.get.push(get)
        if (set) result.set.push(set)
        if (value) result.value.push(value)
        break
      default:
        assert(false, 'Unexpected type: ' + typeof current)
    }    
  }

  return result
}

function getMemberChecks(reflect, type, key) {
  const result = {
    value: [],
    get: [],
    set: [],
  }

  for (const current of reflect.getDescriptor(type, key, {
    reverseHierarchy: true,
  })) {
    switch (typeof current) {
      case 'function': break
      case 'object':
        if (current.get)
          result.get.push(current.get())
        if (current.set)
          result.set.push(current.set())
        if ('value' in current)
          result.value.push(current.value)
        break
      default:
        assert(false, 'Unexpected type: ' + typeof current)
    }
  }

  return result
}

function createTypeCheck(requirements) {
  const check = contract([requirements])
  return function() { check(this) }
}

function createThisCheck(requirements) {
  const check = contract([requirements])
  return function() { check(this) }
}

function createArgCheck(requirements) {
  return contract(requirements)
}

export function getConditions(type, key) {
  const typeCheck = getTypeChecks(type)
  const typePrecondition = getTypeConditions(type, TypePrecondition)
  const typePostcondition = getTypeConditions(type, TypePostcondition)
  const precondition = getMemberConditions(PartialPreconditions, type, key)
  const postcondition = getMemberConditions(PartialPostconditions, type, key)
  const thisCheck = getMemberChecks(PartialThisChecks, type, key)
  const argCheck = getMemberChecks(PartialArgChecks, type, key)

  const conditions = trimPojo({
    typePrecondition: [
      ...typeCheck.map(createTypeCheck),
      ...typePrecondition,
    ], 
    precondition: [
      ...thisCheck.value.map(createThisCheck),
      ...argCheck.value.map(createArgCheck),
      ...precondition.value,
    ],
    getPrecondition: [
      ...thisCheck.get.map(createThisCheck),
      ...precondition.get,
    ],
    setPrecondition: [
      ...thisCheck.set.map(createThisCheck),
      ...precondition.set,
    ], 

    typePostcondition,
    postcondition: postcondition.value,
    getPostcondition: postcondition.get,
    setPostcondition: postcondition.set,
  })

  return conditions
}
