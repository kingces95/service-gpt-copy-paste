import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { FunctionBuilder } from '@kingjs/function-builder'
import { trimPojo } from '@kingjs/pojo-trim'

export function es6CreateThunk(descriptor, conditions) {
  if (!conditions) 
    return Es6Compiler.emit({ ...descriptor })

  if ('value' in descriptor && typeof descriptor.value != 'function')
    return Es6Compiler.emit({ ...descriptor })

  for (const key in conditions)
    conditions[key] = FunctionBuilder.require(conditions[key])

  return Es6Thunk.createDescriptor(descriptor, conditions)
}

function decorateThunk(thunk, fn) {
  thunk.__target = fn

  Object.defineProperty(thunk, 'name', {
    value: fn.name + '_thunk',
    configurable: true,
  })
}

class Es6Thunk {
  static createDescriptor(descriptor, conditions) {
    descriptor = Es6Compiler.emit({ ...descriptor })
    descriptor.get = Es6Thunk.createGetter(descriptor.get, conditions)
    descriptor.set = Es6Thunk.createSetter(descriptor.set, conditions)
    descriptor.value = Es6Thunk.createMethod(descriptor.value, conditions)
    return trimPojo(descriptor)    
  }

  static createMethod(method, conditions) {
    return Es6TypeThunk.create(
      Es6MethodThunk.create(method, conditions), 
    conditions)    
  }

  static createGetter(getter, conditions) {
    return Es6Thunk.createMethod(
      Es6GetterThunk.create(getter, conditions), 
      conditions)    
  }

  static createSetter(setter, conditions) {
    return Es6Thunk.createMethod(
      Es6SetterThunk.create(setter, conditions), 
    conditions)    
  }

  static create(fn, precondition, postcondition, thunk) {
    if (!fn) return fn
    if (!precondition && !postcondition) return fn
    decorateThunk(thunk, fn)
    return thunk  
  }
}

class Es6TypeThunk extends Es6Thunk {
  static create(fn, { typePrecondition, typePostcondition }) {
    return Es6Thunk.create(fn, typePrecondition, typePostcondition,
      function() {
        typePrecondition?.call(this)
        const result = fn.apply(this, arguments)
        typePostcondition?.call(this)
        return result    
      }
    )
  }
}

class Es6GetterThunk extends Es6Thunk {
  static create(fn, { getPrecondition, getPostcondition }) {
    return Es6Thunk.create(fn, getPrecondition, getPostcondition,
      function() {
        getPrecondition?.call(this)
        const result = fn.call(this)
        getPostcondition?.call(this, result)
        return result    
      }
    )
  }
}

class Es6SetterThunk extends Es6Thunk {
  static create(fn, { setPrecondition, setPostcondition }) {
    return Es6Thunk.create(fn, setPrecondition, setPostcondition,
      function(arg0) {
        setPrecondition?.call(this, arg0)
        fn.call(this, arg0)
        setPostcondition?.call(this)
      }
    )
  }
}

class Es6MethodThunk extends Es6Thunk {
  static create(fn, { precondition, postcondition }) {
    return Es6Thunk.create(fn, precondition, postcondition,
      function() {
        precondition?.apply(this, arguments)
        const result = fn.apply(this, arguments)
        if (result === undefined)
          postcondition?.call(this)
        else
          postcondition?.call(this, result)
        return result    
      }
    )
  }
}
