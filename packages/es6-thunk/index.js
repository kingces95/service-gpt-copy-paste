import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { FunctionBuilder } from '@kingjs/function-builder'
import { trimPojo } from '@kingjs/pojo-trim'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Lazy } from '@kingjs/lazy'
import { Es6Compiler } from '@kingjs/es6-compiler'

export function createStub(type, key, descriptor, getConditionsFn) {
  assert(getConditionsFn, 'getConditionsFn is required')

  const thunk = new Lazy(() => 
    es6CreateThunk(descriptor, 
      getConditionsFn(type, key)))

  function installStub(ctor) {
    if (ctor == type) return false
    Object.defineProperty(ctor.prototype, key, 
      createStub(ctor, key, descriptor, getConditionsFn))
    return true
  }

  const method = function() { 
    if (installStub(this.constructor))
      return this[key](...arguments)
    const { value } = thunk.value
    return value.apply(this, arguments)
  }
  const getter = function() { 
    if (installStub(this.constructor))
      return this[key]
    const { get } = thunk.value
    return get.call(this)
  }
  const setter = function(value) { 
    if (installStub(this.constructor)) {
      this[key] = value
      return
    }
    const { set } = thunk.value
    return set.call(this, value)
  }

  const { value, get, set } = descriptor

  function setName(fn, name) {
    Object.defineProperty(fn, 'name', {
      value: name + '_stub',
      configurable: true,
    })
  }

  setName(method, value?.name)
  setName(getter, get?.name)
  setName(setter, set?.name)

  method.__target = value
  getter.__target = get
  setter.__target = set
  
  const stub = Es6Compiler.emit({ ...descriptor })
  switch (Es6Descriptor.typeof(stub)) {
    case 'method': 
      stub.value = method
      break
    case 'getter':
      stub.get = getter
      break
    case 'setter':
      stub.set = setter
      break
    case 'property':
      stub.get = getter
      stub.set = setter
      break
    case 'field':
    default:
  }

  return stub
}

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
