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

// Metadata

// Es6Reflector supports metadata which is a prototype chain of the static 
// field descriptors of a type found by traversing the instance prototype
// chain. 

// The instance prototype chain is choosen for metadata instead of
// the static prototype chain since it can be transformed by the user via
// the injected function getPrototypeFn so may include additional classes
// not found on the static chain. Roughly, the instance chain is allows
// for reflection on the runtime behavior of the type whereas the static 
// chain allows reflection on the hierarchy of the type as declared in the 
// source code. 

export class Es6Reflector {
  #instance
  #static
  #metadata

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
                descriptors[key] = descriptor
                break
            }
          }

          return Es6Prototype.createLink(currentType, prototype, descriptors)
        }, null)
      }
    })
  }

  #reflect(isStatic = false) { 
    return isStatic ? this.#static : this.#instance 
  }

  *#ownValues(reflect, type, instance, { 
    descriptorType, valueType } = { }) {
    const valueFilter = valueType 
      ? value => this.isExtensionOf(value, valueType) : null
    
    yield* reflect.ownValues(type, 
      instance, { descriptorType, valueFilter })
  }

  *#values(reflect, type, instance, { 
    descriptorType, valueType, includeOverridden } = { }) {
    const valueFilter = valueType 
      ? value => this.isExtensionOf(value, valueType) : null

    yield* reflect.values(type, 
      instance, { descriptorType, valueFilter, includeOverridden })
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

  // static/instance agnostic methods
  *knownTypes() { 
    yield* this.#instance.knownTypes()
  }

  // metadata methods
  getMetadata(type) {
    return this.#metadata.getPrototype(type)
  }
  *ownMetadataValues(type, { valueType } = { }) {
    yield* this.#ownValues(this.#metadata, type, null, { valueType })
  }
  *metadataValues(type, { valueType, includeOverridden } = { }) {
    yield* this.#values(this.#metadata, type, null, { 
      valueType, includeOverridden })
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
  getPrototype(type, { isStatic } = { }) {
    return this.#reflect(isStatic).getPrototype(type)
  }
  isKnown(type, { isStatic } = { }) {
    return this.#reflect(isStatic).isKnown(type)
  }
  *knownKeys({ isStatic } = { }) { 
    yield* this.#reflect(isStatic).knownKeys() 
  }
  isKnownKey(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).isKnownKey(type, name)
  }
  hasOwnKey(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).hasOwnKey(type, name)
  }
  hasKey(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).hasKey(type, name)
  }
  *ownKeys(type, { isStatic } = { }) {
    yield* this.#reflect(isStatic).ownKeys(type)
  }
  *keys(type, { isStatic, includeOverridden } = { }) {
    yield* this.#reflect(isStatic).keys(type, { includeOverridden })
  }
  *ownHosts(type, name, { isStatic } = { }) {
    yield* this.#reflect(isStatic).ownHosts(type, name)
  }
  *hosts(type, name, { isStatic } = { }) {
    yield* this.#reflect(isStatic).hosts(type, name)
  }
  getImplementingHost(type, name, { isStatic } = { }) {
    return this.#reflect(isStatic).getImplementingHost(type, name)
  }
  getOwnDescriptor(type, name, { isStatic, descriptorFilter } = { }) {
    return this.#reflect(isStatic)
      .getOwnDescriptor(type, name, { descriptorFilter })
  }
  *ownDescriptors(type, { isStatic, descriptorFilter } = { }) {
    yield* this.#reflect(isStatic)
      .ownDescriptors(type, { descriptorFilter })
  }
  *getDescriptor(type, name, { isStatic, descriptorFilter } = { }) {
    yield* this.#reflect(isStatic)
      .getDescriptor(type, name, { descriptorFilter })
  }
  *descriptors(type, { 
    isStatic, descriptorFilter, includeOverridden } = { }) {
    yield* this.#reflect(isStatic)
      .descriptors(type, { includeOverridden, descriptorFilter })
  }
  *ownValues(type, { 
    descriptorType, valueType, isStatic } = { }) {
    const instance = isStatic ? type : type.prototype
    yield* this.#ownValues(this.#reflect(isStatic), type, instance, { 
      descriptorType, valueType })
  }
  *values(type, { 
    descriptorType, valueType, isStatic, includeOverridden } = { }) {
    const instance = isStatic ? type : type.prototype
    yield* this.#values(this.#reflect(isStatic), type, instance, { 
      descriptorType, valueType, includeOverridden })
  }
}
