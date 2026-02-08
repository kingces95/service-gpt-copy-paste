import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { FunctionBuilder } from '@kingjs/function-builder'

export function es6CreateThunk(descriptor, {
    type: { 
      precondition: typePrecondition, 
      postcondition: typePostcondition, 
    } = { },
    precondition: {
      value: preconditionValue,
      get: preconditionGet,
      set: preconditionSet,
    } = { },
    postcondition: {
      value: postconditionValue,
      get: postconditionGet,
      set: postconditionSet,
    } = { },
  } = { }) {

  typePrecondition = FunctionBuilder.require(typePrecondition)
  typePostcondition = FunctionBuilder.require(typePostcondition)

  preconditionValue = FunctionBuilder.require(preconditionValue)
  postconditionValue = FunctionBuilder.require(postconditionValue)
  
  preconditionGet = FunctionBuilder.require(preconditionGet)
  postconditionGet = FunctionBuilder.require(postconditionGet)
  
  preconditionSet = FunctionBuilder.require(preconditionSet)
  postconditionSet = FunctionBuilder.require(postconditionSet)

  if (!typePrecondition && !typePostcondition 
    && !preconditionValue && !preconditionGet && !preconditionSet
    && !postconditionValue && !postconditionGet && !postconditionSet)
    return Es6Compiler.emit({ ...descriptor })

  const { value, get, set } = descriptor

  const method = function() {
    try { 
      typePrecondition?.call(this) 
      preconditionValue?.apply(this, arguments)
      const result = value.apply(this, arguments)
      postconditionValue?.call(this, result)
      return result
    } finally { 
      typePostcondition?.call(this) 
    }
  }
  const getter = function() {
    try { 
      typePrecondition?.call(this)
      preconditionValue?.call(this)
      preconditionGet?.call(this)
      const result = get.call(this)
      postconditionGet?.call(this, result)
      postconditionValue?.call(this, result)
      return result
    } finally { 
      typePostcondition?.call(this) 
    }
  }
  const setter = function(value) {
    try { 
      typePrecondition?.call(this)
      preconditionValue?.call(this, value)
      preconditionSet?.call(this, value)
      set.call(this, value)
      postconditionSet?.call(this)
      postconditionValue?.call(this)
    } finally { 
      typePostcondition?.call(this) 
    }
  }

  function setName(fn, name) {
    Object.defineProperty(fn, 'name', {
      value: name + '_thunk',
      configurable: true,
    })
  }

  setName(method, descriptor.value?.name)
  setName(getter, descriptor.get?.name)
  setName(setter, descriptor.set?.name)

  method.__target = descriptor.value
  getter.__target = descriptor.get
  setter.__target = descriptor.set

  const stub = Es6Compiler.emit({ ...descriptor })
  const type = Es6Descriptor.typeof(stub)
  switch (type) {
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