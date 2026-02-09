import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { es6CreateThunk } from '@kingjs/es6-create-thunk'
import { PartialReflect } from '@kingjs/partial-reflect'
import { UserReflect } from '@kingjs/user-reflect'
import { trimPojo } from '@kingjs/pojo-trim'
import { 
  Thunk,
  Preconditions,
  Postconditions,
  TypePrecondition,
  TypePostcondition,
} from '@kingjs/partial-type'

export {
  Thunk,
  Preconditions,
  Postconditions,
  TypePrecondition,
  TypePostcondition,
} from '@kingjs/partial-type'

export class PartialProxy {
  static [Thunk](key, descriptor) {
    if (isAbstract(descriptor)) return descriptor
    const conditions = PartialProxyReflect.getConditions(this, key)
    if (!conditions) return descriptor
    return es6CreateThunk(descriptor, conditions)
  }
}

export class PartialProxyReflect {
  static *getTypeConditions$(type, symbol) {
    const isStatic = { isStatic: true }
    for (const host of [...UserReflect.hierarchy(type, symbol)]) {
      const { value } = UserReflect.getOwnDescriptor(
        host, symbol, isStatic) ?? { }
      if (!value) continue
      assert(typeof value === 'function', 
        `Expected function but got ${typeof value}`)
      yield value
    }
  }
  static *conditions$(type, key, symbol) {
    const isStatic = { isStatic: true }

    const hosts = new Set([
      type, // assume key is in the process of being defined on type
      ...PartialReflect.virtualHosts(type, key)
    ])

    for (const host of hosts) {
      const conditions = UserReflect.getOwnDescriptor(
        host, symbol, isStatic) ?? { }
      const pojo = conditions?.value
      if (!pojo) continue
      yield host

      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      if (!descriptor) continue
      const { get, set, value } = descriptor
      yield { get, set, value }
    }
  }
  static getConditions$(type, key, symbol) {
    const getters = []
    const setters = []
    const values = []

    for (const current of PartialProxyReflect.conditions$(type, key, symbol)) {
      switch (typeof current) {
        case 'function': break
        case 'object':
          const { get, set, value } = current
          if (get) getters.push(get)
          if (set) setters.push(set)
          if (value) values.push(value)
          break
        default:
          assert(false, 'Unexpected type: ' + typeof current)
      }    
    }

    return { 
      value: values, 
      get: getters, 
      set: setters 
    }
  }

  static getConditions(type, key) {
    const self = PartialProxyReflect

    const typePrecondition = [...self.getTypeConditions$(type, TypePrecondition)]
    const typePostcondition = [...self.getTypeConditions$(type, TypePostcondition)]
    const precondition = self.getConditions$(type, key, Preconditions)
    const postcondition = self.getConditions$(type, key, Postconditions)

    return trimPojo({
      type: {
        precondition: typePrecondition.reverse(),
        postcondition: typePostcondition,
      },
      precondition: {
        value: precondition.value.reverse(),
        get: precondition.get.reverse(),
        set: precondition.set.reverse(),
      },
      postcondition,
    })
  }
}