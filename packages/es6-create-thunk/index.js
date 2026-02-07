import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Es6Compiler } from '@kingjs/es6-compiler'

function coerceMemberCondition(condition) {
  if (typeof condition === 'function')
    condition = { value: condition }

  if (condition?.value)
    condition = { ...condition,
      get: condition.value,
      set: condition.value,
    }

  return condition
}

function isMemberConditionEmpty(condition) {
  if (!condition) return true
  if (condition.value) return false
  if (condition.get) return false
  if (condition.set) return false
  return true
}

export function es6CreateThunk(descriptor, {
    typePrecondition, // function
    typePostcondition, // function
    memberPrecondition, // function or { value, get, set }
    memberPostcondition, // function or { value, get, set }
  } = { }) {

  memberPrecondition = coerceMemberCondition(memberPrecondition)
  memberPostcondition = coerceMemberCondition(memberPostcondition)

  if (!typePrecondition &&
      !typePostcondition &&
      isMemberConditionEmpty(memberPrecondition) &&
      isMemberConditionEmpty(memberPostcondition))
    return Es6Compiler.emit({ ...descriptor })

  const method = function() {
    try { 
      typePrecondition?.call(this) 
      memberPrecondition?.value?.apply(this, arguments)
      const result = descriptor.value.apply(this, arguments)
      memberPostcondition?.value?.call(this, result)
      return result
    } finally { 
      typePostcondition?.call(this) 
    }
  }
  const getter = function() {
    try { 
      typePrecondition?.call(this)
      memberPrecondition?.get?.call(this)
      const result = descriptor.get.call(this)
      memberPostcondition?.get?.call(this, result)
      return result
    } finally { 
      typePostcondition?.call(this) 
    }
  }
  const setter = function(value) {
    try { 
      typePrecondition?.call(this)
      memberPrecondition?.set?.call(this, value)
      descriptor.set?.call(this, value)
      memberPostcondition?.set?.call(this)
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