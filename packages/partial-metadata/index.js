import { assert } from '@kingjs/assert'
import { trimPojo } from '@kingjs/pojo-trim'
import { Prototype } from '@kingjs/prototype'
import { PartialType } from '@kingjs/partial-type'
import { contract } from '@kingjs/function-contract'
import { Tuple } from '@kingjs/tuple'
import { asIterable } from '@kingjs/as-iterable'
import {
  Preconditions,
  Postconditions,
  TypeChecks,
  ThisChecks,
  ArgChecks,
  Defaults,
  Transforms,
  TypePrecondition,
  TypePostcondition,

  // this file intentially does not import
  //    Extends
  //    Implements
  //    Defines
  //    Abstracts
  // since these relate to extensions of PartialTypes and this file concerns
  // itself with querying metadata across all extensions of PartialTypes in
  // the abstract.
} from '@kingjs/partial-symbols'

// ____________________________________________________________________________
// METADATA

const ThisNames = Tuple.of('this')

// PartialMetadata supports metadata which is a prototype chain of the
// static field descriptors of a type found by traversing the type
// hiearchy of the instance prototype chain. For example, implementing

  //  myContainer instanceof RangeProbe

// where MyContainer publishes a cursorType whose prototype structurally
// satisfies InputCursorShape like,

    //  class InputCursorShape extends Shape {
    //    step() { }
    //    get value() { }
    //  }
    //  class RangeShape extends Shape {
    //    get prototypeCursor() { ... }
    //  }

  //  class MyCursor {
  //    static { implement(this, ReadableCursorConcept, { ... }) }
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

// requires testing if MyContainer's cursorType prototype satisfies
// InputCursorShape. The cursorType may be provided directly by the concrete
// type, or by a RangeConcept helper that derives it from a static cursorType.

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

export function createPartialMetadata(PartialReflect) {
  const PartialMetadata = PartialReflect.map({
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

  // __________________________________________________________________________
  // PRECONDITIONS AND POSTCONDITIONS

// PartialPreconditions supports preconditions which is a prototype chains of
// the function descriptors of a type found by traversing the type hierarchy of
// the metadata prototype chain.

// Continuing the above example, if MyCursor, InputCursorPart and Cursor
// defined preconditions like,
//
// Shapes are transparent structural requirements and do not appear in the
// metadata prototype chain. Preconditions that need thunk discovery live on
// parts such as InputCursorPart.

  //  MyCursor[Preconditions] = {
  //    step() { ...precondition... }
  //  }

  //  Cursor[Preconditions] = {
  //    value() { ...precondition... }
  //  }

  //  InputCursorPart[Preconditions] = {
  //    value() { ...precondition... }
  //    step() { ...precondition... }
  //  }

// then the metadata prototype chain of MyCursor would be like,

  // MyCursor (Preconditions)
  // └── InputCursorPart (Preconditions)
  //     └── Cursor (Preconditions)
  //         └── Object
  //             └── null

// which is transformed into a preconditions chain by expanding the
// Preconditions POJOs into a chain like,

  // MyCursor (step)
  // └── InputCursorPart (value, step)
  //     └── Cursor (value)
  //         └── null

// Querying the preconditions chain for MyCursor for precondition by key
// would yield descriptors for all relevant preconditions. For example,
// querying for the step precondition would yield the step preconditions
// on MyCursor and InputCursorPart but not Cursor since Cursor does
// not define a step precondition.

// PartialPostconditions, PartialThisChecks and PartialArgChecks are
// similarly defined and useful for quering metadata defined use their
// respective symbols.

  function partialReflectOnMetaObject(symbol) {
    return PartialMetadata.map({
      knownKeys: [ 'constructor' ],
      getPrototype: function(type) {
        const values = [...this.findValues(type, symbol)].reverse()

        return values.reduce((prototype, { host, value }) => {
          const descriptors = Object.getOwnPropertyDescriptors(value)
          return Prototype.create(host, prototype, descriptors)
        }, null) ?? Prototype.create(type)
      }
    })
  }

  const PartialPreconditions
    = partialReflectOnMetaObject(Preconditions)

  const PartialPostconditions
    = partialReflectOnMetaObject(Postconditions)

  const PartialThisChecks
    = partialReflectOnMetaObject(ThisChecks)

  const PartialArgChecks
    = partialReflectOnMetaObject(ArgChecks)

  const PartialDefaults
    = partialReflectOnMetaObject(Defaults)

  const PartialTransforms
    = partialReflectOnMetaObject(Transforms)

  function getTypeConditions(type, symbol) {
    return [...PartialMetadata.findValues(type, symbol, {
      includeOverridden: true,
      reverseHierarchy: true,
      descriptorType: 'field',
      instanceOf: Function,
    }).map(({ value }) => value)]
  }

  function getTypeChecks(type) {
    return [...PartialMetadata.findValues(type, TypeChecks, {
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

    for (const current of reflect.findDescriptors(type, key, {
      reverseHierarchy: true,
    })) {
      switch (typeof current) {
        case 'function': break
        case 'object':
          const { get, set, value } = current
          if (get) result.get.push(...asIterable(get))
          if (set) result.set.push(...asIterable(set))
          if (value) result.value.push(...asIterable(value))
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

    for (const current of reflect.findDescriptors(type, key, {
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
    const check = contract([requirements], ThisNames)
    return function() { check(this) }
  }

  function createArgCheck(requirements, defaults) {
    return contract(requirements, defaults)
  }

  function getMemberDefaults(type, key) {
    const result = PartialDefaults.getValue(type, key, { context: true })
    if (!result) return

    assert(result.type == 'field')
    return result.value
  }

  function getOwnMemberTransforms(type, key) {
    return PartialTransforms.getOwnDescriptor(type, key, {
      descriptorType: 'field',
    })?.value
  }

  function getConditions(type, key) {
    const typeCheck = getTypeChecks(type)
    const typePrecondition = getTypeConditions(type, TypePrecondition)
    const typePostcondition = getTypeConditions(type, TypePostcondition)
    const precondition = getMemberConditions(PartialPreconditions, type, key)
    const postcondition = getMemberConditions(PartialPostconditions, type, key)
    const thisCheck = getMemberChecks(PartialThisChecks, type, key)
    const argCheck = getMemberChecks(PartialArgChecks, type, key)
    const defaults = getMemberDefaults(type, key)

    return trimPojo({
      typePrecondition: [
        ...typeCheck.map(createTypeCheck),
        ...typePrecondition,
      ],
      precondition: [
        ...thisCheck.value.map(createThisCheck),
        ...argCheck.value.map(value => createArgCheck(value, defaults)),
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
  }

  return {
    PartialMetadata,
    PartialPreconditions,
    PartialPostconditions,
    PartialThisChecks,
    PartialArgChecks,
    PartialDefaults,
    PartialTransforms,
    getConditions,
    getMemberDefaults,
    getOwnMemberTransforms,
  }
}
