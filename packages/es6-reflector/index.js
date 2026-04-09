import { assert } from '@kingjs/assert'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'
import { asIterable } from '@kingjs/as-iterable'

const ObjectCtorWithStatics = Es6Prototype.createLink(
      Object, null, Object.getOwnPropertyDescriptors(Object))
const ObjectCtorWithoutStatics = Es6Prototype.createLink(Object)

// Es6Reflector supports reflection on ES6 class static and instance members.
// The static members are copied onto a parallel prototype chain so that the
// same algorithms used to query instance members can be used to query
// static members. For example,

  //    class A { static a() }

// is transformed into:

  //    Class A$ extends null { a() }

// so reflecting over A$'s instance members yield static members of A. 
// This roghly works. The catch is that the prototype chain of A is:

  //    A
  //    └── Function.prototype
  //        └── Object.prototype
  //            └── null

// Whereas the prototype chain of A$ is:

  //    A$
  //    └── null

// The final links in the prototype chain are different so would yield
// different members so need to be somehow rationalized.

// There are three possible final links in the static prototype chain 
// depending on how an ES6 class is defined. Here are the three cases, 
// the static and instance prototype chains, and the Es6Reflector 
// transformation:

// 1. class A { }

  // ES6 Chains:                        Es6Reflector Chain:
  // A                                  A$
  // └── Function.prototype       ->    └── Object*
  //     └── Object.prototype               └── null
  //         └── null                                                                                                                              
  //                                                                                                      
  // A.prototype                                                                                                  
  // └── Object.prototype                                                                                           
  //     └── null                                                                                   
 
// 2. class A extends Object { }                                                                             

  // ES6 Class:                         Static Prototype Chain:
  // A                                  A$
  // └── Object                   ->    └── Object`
  //     └── Function.prototype             └── null
  //         └── Object.prototype           
  //             └── null  
  //                                                                                                      
  // A.prototype                                                                                                  
  // └── Object.prototype                                                                                           
  //     └── null 

// 3. class A extends null

  // ES6 Chains:                        Static Prototype Chain:
  // A                                  A$
  // └── Function.prototype       ->    └── null
  //     └── Object.prototype               
  //         └── null     
  //                                                                                                      
  // A.prototype                                                                                                  
  // └── null                                                                                   

// Notes justifying the above transformation:

// A naive enumerations of A's static members would include instance members 
// of Function and Object. For example, .bind() and .hasOwnProperty() would be
// included. This is an artifact of the fact that ES6 classes are exposed as 
// Function instances which are also Object instances. For this reason 
// Function.prototype and Object.prototype are excluded so that fter 
// transformation to A$ the same naive reflection of A's static members 
// exclude Function and Object instance members.

// The first two examples result in Object.prototype in the _instance_
// prototype chain whereas the third example does not. Conceptually, the first
// two cases define first class objects which, when activated, inherit Object's 
// instance members. It is natural, therefore, for an enumeration of the
// base types to include Object hence Object is included in the transformation. 
// The third case, where the class extends null, defines a class that is more 
// akin to a hashtable with syntactic sugar for CRUD operations. It is natural, 
// therefore, for an enumeration of its base types to exclude Object hence 
// Object is excluded in the transformation.

// Finally, ES6 allows for explicit and implicit extensions of Object (cases 
// 1 and 2 respectively) which include and exclude Object's static members 
// respectively. For this reasonly Object* exlucdes the static members of Object 
// where Object` includes them. Both Object* and Object` include a .constructor 
// member since it is needed to construct an instance prototype chain.  

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

export class Es6Reflector {

  static isMetadata(value) {
    // base case: primitives and types are metadata
    if (value == null) return true
    
    const typeofValue = typeof value
    if (typeofValue == 'function') return true
    if (typeofValue == 'symbol') return true
    if (typeofValue == 'string') return true
    if (typeofValue == 'number') return true
    if (typeofValue == 'boolean') return true

    assert(typeofValue == 'object')
    
    if (Aarray.isArray(value)) {
      // recursive case: arrays whose elements are metadata
      for (const element of value)
        if (!Es6Reflector.isMetadata(element)) 
          return false
      }
      else {
      // recursive case: plain objects whose values are metadata
      if (value?.constructor != Object) return false
      for (const key in Reflect.ownKeys(value))
        if (!Es6Reflector.isMetadata(value[key])) 
          return false
    }

    return true
  }

  #instance
  #static
  #metadata
  #metadataPrototypes

  constructor({
    knownTypes = [], knownTypeFn,
    knownKeys = [], knownKeyFn,
    knownStaticKeys = [], knownStaticKeyFn,
    getPrototypeFn = type => type.prototype,
  } = { }) {
    this.#instance = new Es6Prototype({
      knownTypes, knownTypeFn,
      knownKeys, knownKeyFn,
      getPrototypeFn,
    })

    knownStaticKeys.push('constructor')

    this.#static = new Es6Prototype({
      knownTypes, knownTypeFn,
      knownKeys: knownStaticKeys,
      knownKeyFn: knownStaticKeyFn,
      getPrototypeFn: type => {
        // base case 1: class A { }
        if (type == Function.prototype) 
          return ObjectCtorWithoutStatics

        // base case 2: class A extends Object { }
        if (type == Object) 
          return ObjectCtorWithStatics

        const baseType = Object.getPrototypeOf(type)
        const basePrototype = 
          // base case 3: class A extends null { }
          baseType == Function.prototype 
            && Object.getPrototypeOf(type.prototype) == null ? null

          // recursive case: class B extends A { }
          : this.#static.getPrototype(baseType)

        const descriptors = Object.getOwnPropertyDescriptors(type)
        return Es6Prototype.createLink(type, basePrototype, descriptors)
      }
    })

    this.#metadata = new Es6Prototype({
      knownKeys: [ 'constructor' ],
      getPrototypeFn: type => {
        const hierarchy = [...this.hierarchy(type)]

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
                const descriptor = current
                const value = descriptor.value
                if (!Es6Reflector.isMetadata(value)) continue
                descriptors[key] = descriptor
                break
            }
          }

          return Es6Prototype.createLink(currentType, prototype, descriptors)
        }, null)
      }
    })

    this.#metadataPrototypes = new Map()
  }

  #createMetadataPrototype(symbol) {
    return new Es6Prototype({
      knownKeys: [ 'constructor' ],
      getPrototypeFn: type => {
        const values = [...this.getMetadataValue(type, symbol)].reverse()

        return values.reduce((prototype, { host, value }) => {
          const descriptors = Reflect.getOwnPropertyDescriptors(value)
          return Es6Prototype.createLink(host, prototype, descriptors)
        }, null)
      }
    })
  }

  #reflect(isStatic = false) { 
    return isStatic ? this.#static : this.#instance 
  }

  *#areExtensionsOf(types, filter) {
    if (!filter) yield* types

    filter:
    for (const type of types) {
      for (const filterType of asIterable(filter))
        if (!this.isExtensionOf(type, filterType)) 
          continue filter

      yield type
    } 
  }

  #extensionOfFilter(type) {
    return type 
      ? ({value}) => this.isExtensionOf(value, type) 
      : () => true
  }

  // metadata methods
  getMetadataPrototype(type, key) {
    if (!key) return this.#metadata.getPrototype(type)

    if (!this.#metadataPrototypes.has(key)) 
      this.#metadataPrototypes.set(key, 
        this.#createMetadataPrototype(key))

    return this.#metadataPrototypes.get(key).getPrototype(type)
  }
  *ownMetadataValues(type, { instanceOf, extensionOf } = { }) {
    yield* this.#metadata.ownValues(type, { instanceOf })
      .filter(this.#extensionOfFilter(extensionOf))
  }
  *getMetadataValue(type, name, { instanceOf, extensionOf } = { }) {
    yield* this.#metadata.getValue(type, name, { instanceOf})
      .filter(this.#extensionOfFilter(extensionOf))
  }
  *metadataValues(type, { includeOverridden, instanceOf, extensionOf } = { }) {
    yield* this.#metadata.values(type, { includeOverridden, instanceOf })
      .filter(this.#extensionOfFilter(extensionOf))
  }

  // static exclusive methods
  isExtensionOf(type, targetType, { minDepth = 1 } = { }) {
    if (!type) return false
    if (typeof type != 'function') return false
    
    let depth = 0
    for (const base of this.#static.hierarchy(type)) {
      if (base == targetType) return depth >= minDepth
      depth++
    }

    return false
  }
  *extensions(type) {
    yield* this.#static.hierarchy(type)
  }
  getExtendedType(type) {
    return this.#static.getBaseType(type)
  }
  isAbstract(type) {
    return type != Object && !this.isExtensionOf(type, Object)
  }

  // instance exclusive methods
  *hierarchy(type, { filter } = { }) { 
    const types = this.#instance.hierarchy(type)
    yield* this.#areExtensionsOf(types, filter)
  }
  *baseTypes(type, { filter } = { }) { 
    const types = this.#instance.hierarchy(type)
    types.next() // skip self
    yield* this.#areExtensionsOf(types, filter)
  }
  getBaseType(type) {
    return this.#instance.getBaseType(type)
  }
  canDuckCast(type, targetType) {
    return this.#instance.canDuckCast(type, targetType)
  }

  // shared methods
  getPrototype(type, { isStatic } = { }) {
    return this.#reflect(isStatic).getPrototype(type)
  }
  typeof(type, key, descriptor, { isStatic } = { }) {
    const descriptorType = Es6Descriptor.typeof(descriptor)
    if (descriptorType != 'field')
      return descriptorType

    const value = descriptor.value
    const es6Type = es6Typeof(value)
    if (!isStatic && key === 'constructor' && value === type) {
      assert(es6Type == 'class')
      return 'constructor'
    }

    return 'field'
  }
  *ownValues(type, { isStatic, 
    descriptorType, extensionOf, instanceOf } = { }) {
    const instance = isStatic ? type : type.prototype
    const options = { instance, descriptorType, instanceOf }
    yield* this.#reflect(isStatic).ownValues(type, options)
      .filter(this.#extensionOfFilter(extensionOf))
  }
  *getValue(type, name, { isStatic, includeOverridden, 
    descriptorType, extensionOf, instanceOf } = { }) {
    const instance = isStatic ? type : type.prototype
    const options = { instance, includeOverridden, descriptorType, instanceOf }
    yield* this.#reflect(isStatic).getValue(type, name, options)
      .filter(this.#extensionOfFilter(extensionOf))
  }
  *values(type, { isStatic, includeOverridden, 
    descriptorType, extensionOf, instanceOf } = { }) {
    const instance = isStatic ? type : type.prototype
    const options = { instance, includeOverridden, descriptorType, instanceOf }
    yield* this.#reflect(isStatic).values(type, options)
      .filter(this.#extensionOfFilter(extensionOf))
  }

  // static thunks
  static {
    const thunks = [
      'getPrototype', 'isKnown', 'isKnownKey', 'hasOwnKey', 'hasKey',
      'ownKeys', 'keys', 'hosts', 'getOwnDescriptor', 'ownDescriptors',
      'getDescriptor', 'descriptors', 
    ]

    for (const name of thunks) {
      const member = function(...args) {
        const options = args[args.length - 1]
        const self = this.#reflect(options?.isStatic)
        return self[name].apply(self, args)
      }
      Object.defineProperty(this.prototype, name, { 
        value: member,
        enumerable: false,
        configurable: true,
        writable: true,
      })
    }
  }
  // getPrototype(type, { isStatic } = { }) {
  //   return this.#reflect(isStatic).getPrototype(type)
  // }
  // isKnown(type, { isStatic } = { }) {
  //   return this.#reflect(isStatic).isKnown(type)
  // }
  // isKnownKey(type, name, { isStatic } = { }) {
  //   return this.#reflect(isStatic).isKnownKey(type, name)
  // }
  // hasOwnKey(type, name, { isStatic } = { }) {
  //   return this.#reflect(isStatic).hasOwnKey(type, name)
  // }
  // hasKey(type, name, { isStatic } = { }) {
  //   return this.#reflect(isStatic).hasKey(type, name)
  // }
  // *ownKeys(type, { isStatic } = { }) {
  //   yield* this.#reflect(isStatic).ownKeys(type)
  // }
  // *keys(type, { isStatic, includeOverridden } = { }) {
  //   yield* this.#reflect(isStatic).keys(type, { includeOverridden })
  // }
  // *hosts(type, name, { isStatic } = { }) {
  //   yield* this.#reflect(isStatic).hosts(type, name)
  // }
  // getOwnDescriptor(type, name, { isStatic, descriptorType } = { }) {
  //   return this.#reflect(isStatic)
  //     .getOwnDescriptor(type, name, { descriptorType })
  // }
  // *ownDescriptors(type, { isStatic, descriptorType } = { }) {
  //   yield* this.#reflect(isStatic)
  //     .ownDescriptors(type, { descriptorType })
  // }
  // *getDescriptor(type, name, { isStatic, descriptorType } = { }) {
  //   yield* this.#reflect(isStatic)
  //     .getDescriptor(type, name, { descriptorType })
  // }
  // *descriptors(type, { 
  //   isStatic, descriptorType, includeOverridden } = { }) {
  //   yield* this.#reflect(isStatic)
  //     .descriptors(type, { includeOverridden, descriptorType })
  // }
}
