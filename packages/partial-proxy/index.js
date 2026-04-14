import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { es6CreateThunk } from '@kingjs/es6-thunk'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Thunk } from '@kingjs/partial-symbols'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Lazy } from '@kingjs/lazy'
import { getConditions } from '@kingjs/partial-reflect'

export {
  Thunk,
  Preconditions,
  Postconditions,
  TypePrecondition,
  TypePostcondition,
} from '@kingjs/partial-symbols'

export class PartialProxy {
  static [Thunk](key, descriptor) {
    if (isAbstract(descriptor)) return descriptor
    return createStub(this, key, descriptor)
  }
}

function createStub(type, key, descriptor) {
  const thunk = new Lazy(() => 
    es6CreateThunk(descriptor, 
      getConditions(type, key)))

  function installStub(ctor) {
    if (ctor == type) return false
    Object.defineProperty(ctor.prototype, key, 
      createStub(ctor, key, descriptor))
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
