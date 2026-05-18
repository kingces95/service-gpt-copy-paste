import { Es6Compiler } from '@kingjs/es6-compiler'
import { trimPojo } from '@kingjs/pojo-trim'
import { Lazy } from '@kingjs/lazy'

import { decorate } from './decorate.js'
import { createThunk } from './thunk.js'

// Conditions are gathered lazily so a type can finish declaring its partial
// relationships before metadata chains are loaded. If a type declares a
// condition for a member, then it must also declare that member, often as an
// abstract member, so the declaration creates a thunk frame for the condition.

function decorateLazy(fn, target) { 
  return decorate(fn, target, 'lazy') 
}

export class Es6ThunkFactory {
  #getConditions
  
  constructor(getConditions) {
    this.#getConditions = getConditions
  }

  create(type, key, descriptor) {
    const lazyThunk = new Lazy(() => 
      createThunk(descriptor, this.#getConditions(type, key)))

    const { value, get, set } = descriptor
    const lazy = trimPojo({
      ...descriptor,

      value: value ? decorateLazy(function() { 
        const thunk = lazyThunk.value
        return thunk.value.apply(this, arguments)
      }, value) : undefined,

      get: get ? decorateLazy(function() { 
        const thunk = lazyThunk.value
        return thunk.get.call(this)
      }, get) : undefined,

      set: set ? decorateLazy(function(value) { 
        const thunk = lazyThunk.value
        return thunk.set.call(this, value)
      }, set) : undefined,
    })

    return Es6Compiler.emit(lazy)
  }
}
