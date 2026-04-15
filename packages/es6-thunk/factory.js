import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { trimPojo } from '@kingjs/pojo-trim'
import { Lazy } from '@kingjs/lazy'

import { decorate } from './decorate.js'
import { createThunk } from './thunk.js'

function decorateStub(fn, target) { 
  return decorate(fn, target, 'stub') 
}

export class Es6ThunkFactory {
  #getConditions
  
  constructor(getConditions) {
    this.#getConditions = getConditions
  }

  create(type, key, descriptor) {
    const lazyThunk = new Lazy(() => 
      createThunk(descriptor, this.#getConditions(type, key)))

    const installStub = (ctor) => {
      if (ctor == type) return false
      Object.defineProperty(ctor.prototype, key, 
        this.create(ctor, key, descriptor))
      return true
    }

    const { value, get, set } = descriptor
    const stub = trimPojo({
      ...descriptor,

      value: value ? decorateStub(function() { 
        if (installStub(this.constructor))
          return this[key](...arguments)
        const thunk = lazyThunk.value
        return thunk.value.apply(this, arguments)
      }, value) : undefined,

      get: get ? decorateStub(function() { 
        if (installStub(this.constructor))
          return this[key]
        const thunk = lazyThunk.value
        return thunk.get.call(this)
      }, get) : undefined,

      set: set ? decorateStub(function(value) { 
        if (installStub(this.constructor)) {
          this[key] = value
          return
        }
        const thunk = lazyThunk.value
        return thunk.set.call(this, value)
      }, set) : undefined,
    })

    return Es6Compiler.emit(stub)
  }
}
