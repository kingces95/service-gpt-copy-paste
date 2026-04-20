import { assert } from '@kingjs/assert'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'
import { asIterable } from '@kingjs/as-iterable'
import { Prototype } from '@kingjs/prototype'

const ObjectCtorWithStatics = Prototype.create(
      Object, null, Object.getOwnPropertyDescriptors(Object))
const ObjectCtorWithoutStatics = Prototype.create(Object)

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

export class Es6Reflector {

  static create({
      knownTypes = [], knownTypeFn,
      knownKeys = [], knownKeyFn,
      knownStaticKeys = [], knownStaticKeyFn,
      getPrototypeFn = type => type.prototype,
    } = { }) {

    knownStaticKeys.push('constructor')

    return new Es6Reflector({ 
      instance$: new Es6Prototype({
        knownTypes, knownTypeFn,
        knownKeys, knownKeyFn,
        getPrototypeFn,
      }),

      static$: new Es6Prototype({
        knownTypes, knownTypeFn,
        knownKeys: knownStaticKeys,
        knownKeyFn: knownStaticKeyFn,
        getPrototypeFn: function(type) {
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
            : this.getPrototype(baseType)

          const descriptors = Object.getOwnPropertyDescriptors(type)
          return Prototype.create(type, basePrototype, descriptors)
        }
      })
    })
  }

  #instance
  #static

  constructor({
    instance$,
    static$,
  }) {
    this.#instance = instance$
    this.#static = static$
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

  on({ 
    knownTypes, knownTypeFn,
    knownKeys, knownKeyFn,
    getPrototypeFn,
  }) {
    return new Es6Reflector({
      static$: this.#static,
      instance$: new Es6Prototype({
        knownTypes, knownTypeFn,
        knownKeys, knownKeyFn,
        getPrototypeFn: (type) => getPrototypeFn.call(this, type),
      })
    })
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

    // return 'getter', 'setter', 'property', 'method'
    if (descriptorType != 'field')
      return descriptorType

    // map 'field' to 'field' or 'constructor'
    const value = descriptor.value
    if (!isStatic && key === 'constructor' && value === type) {
      assert(es6Typeof(value) == 'class')
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
  
  // thunks
  static {
    const thunks = [
      'getPrototype', 'isKnown', 'isKnownKey', 'hasOwnKey', 'hasKey',
      'ownKeys', 'keys', 'hosts', 'getOwnDescriptor', 'ownDescriptors',
      'getDescriptor', 'descriptors', 'copyTo'
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
