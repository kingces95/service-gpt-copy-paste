import { assert } from '@kingjs/assert'
import { Descriptor } from '@kingjs/descriptor'
import { es6Typeof } from '@kingjs/es6-typeof'

const {
  hasGetter,
  hasSetter,
  hasAccessor,
} = Descriptor

// Es6Compiler transforms a descriptor to a descriptor. 
//  - procedural descriptors are transformed such so their metadata is 
//    consistent with typical source code declaration defaults. For example, 
//    methods declared in source code have enumerable: false, configurable: 
//    true, and writable: true. 
//  - data descriptors which are not methods are assumed to be indirect 
//    descriptors and are "transformed" by "dereferencing" the descriptor. 
// These design decision allow DSL to represent:
//  - procedural descriptors using concise syntax and lambdas 
//  - non-standard data descriptors (e.g. non-writable). 
// For example, descriptors of the follow members can be "compiled" into 
// descriptors as though they were declared in source code (e.g. methodAsLambda 
// and methodAsDescriptor descriptors are compiled to look like method's 
// descriptor).
//  {
//    method() { return 42 },
//    get getter() { return 42 },
//    set setter(value) { this._bar = value },
//    methodAsLambda: () => 42,
//    methodAsDescriptor: { value: () => 42 },
//    getterAsDescriptor: { get: () => 42 },
//    setterAsDescriptor: { set: (value) => this._bar = value },
//    const: { 
//      value: 42, 
//      enumerable: true, 
//      configurable: true, 
//      writable: false 
//    },
//  } 
export class Es6Compiler {

  // compile takes a descriptor from a POJO written in the DSL, parses it,
  // emits it, and returns a descriptor that, joined with the name, can be 
  // used with Object.defineProperty. 
  static compile(declaration) {
    const partialDescriptor = Es6Compiler.parse(declaration)
    const descriptor = Es6Compiler.emit(partialDescriptor)    
    return descriptor  
  }

  // Parse transforms a descriptor into a "partial" descriptor.
  // - Parse returns procedural descriptors (getters, setters, methods)
  //   as a partial descriptors with get, set, or value defined
  //   but other metadata (enumerable, configurable, writable) removed.
  // - Parse dereferences returns data descriptors.
  static parse(descriptor) {
    if (!descriptor) return null

    assert(descriptor instanceof Descriptor, 'descriptor must be a Descriptor')

    // accessor
    if (hasAccessor(descriptor)) {
      const result = { }
      if (hasGetter(descriptor)) 
        result.get = descriptor.get
      if (hasSetter(descriptor)) 
        result.set = descriptor.set
      return result
    }

    // deta
    const value = descriptor.value
    const type = typeof value

    // dereference indirect descriptor
    if (type == 'object' && value != null) {
      assert(descriptor.value instanceof Descriptor, 
        'descriptor.value must be a Descriptor')

      return value
    }
      
    // method or other data
    return { value }
  }

  // Emit converts a "partial" descriptor into a full descriptor. 
  // - Emit assigns metadata to any procedural descriptor not already 
  //   assigned to match a typical source code member declaration:
  //    - Accessors: enumerable: false, configurable: true
  //    - Methods: enumerable: false, configurable: true, writable: true
  //    - Data: enumerable: true, configurable: true, writable: true
  static emit(descriptor) {
    if (!descriptor) return null

    assert(descriptor instanceof Descriptor, 
      'descriptor must be a Descriptor')

    const result = { ...descriptor }

    if ('configurable' in result == false)
      result.configurable = true
    
    const type = Descriptor.typeof(result)
    if (type == 'data') {
      if ('writable' in result == false)
        result.writable = true

      const valueType = es6Typeof(result.value)
      if ('enumerable' in result == false)
        result.enumerable = valueType != 'function'
    }
    else {
      if ('enumerable' in result == false)
        result.enumerable = false
    }

    return result
  }
}
