import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { trimPojo } from '@kingjs/pojo-trim'
import { Es6Descriptor } from '@kingjs/es6-descriptor'

import { decorate } from './decorate.js'

function decorateThunk(fn, target) { 
  return decorate(fn, target, 'thunk') 
}

export function createThunk(descriptor, conditions) {
  if (!conditions || Es6Descriptor.typeof(descriptor) == 'field') 
    return Es6Compiler.emit({ ...descriptor })

  descriptor = Es6Compiler.emit({ ...descriptor })
  descriptor.value = createMethodThunk(descriptor.value, conditions)
  descriptor.get = createGetterThunk(descriptor.get, conditions)
  descriptor.set = createSetterThunk(descriptor.set, conditions)
  return trimPojo(descriptor)  
}

function createMethodThunk(target, conditions) {
  return Es6TypeThunk.create(
    Es6MethodThunk.create(target, conditions), 
  conditions)
}

function createGetterThunk(target, conditions) {
  return createMethodThunk(
    Es6GetterThunk.create(target, conditions), 
  conditions)    
}

function createSetterThunk(target, conditions) {
  return createMethodThunk(
    Es6SetterThunk.create(target, conditions), 
  conditions)    
}

class Es6Thunk {
  static create(target, precondition, postcondition, thunk) {
    if (!target) return target
    if (!precondition && !postcondition) return target
    decorateThunk(thunk, target)
    return thunk  
  }
}

class Es6TypeThunk {
  static create(target, { typePrecondition, typePostcondition }) {
    return Es6Thunk.create(target, typePrecondition, typePostcondition,
      function() {
        typePrecondition?.call(this)
        const result = target.apply(this, arguments)
        typePostcondition?.call(this)
        return result    
      }
    )
  }
}

class Es6GetterThunk {
  static create(target, { getPrecondition, getPostcondition }) {
    return Es6Thunk.create(target, getPrecondition, getPostcondition,
      function() {
        getPrecondition?.call(this)
        const result = target.call(this)
        getPostcondition?.call(this, result)
        return result    
      }
    )
  }
}

class Es6SetterThunk {
  static create(target, { setPrecondition, setPostcondition }) {
    return Es6Thunk.create(target, setPrecondition, setPostcondition,
      function(arg0) {
        setPrecondition?.call(this, arg0)
        target.call(this, arg0)
        setPostcondition?.call(this)
      }
    )
  }
}

class Es6MethodThunk {
  static create(target, { precondition, postcondition }) {
    return Es6Thunk.create(target, precondition, postcondition,
      function() {
        precondition?.apply(this, arguments)
        const result = target.apply(this, arguments)
        if (result === undefined)
          postcondition?.call(this)
        else
          postcondition?.call(this, result)
        return result    
      }
    )
  }
}
