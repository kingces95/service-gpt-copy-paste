import { Metadata } from '@kingjs/metadata'
import { genericType } from '@kingjs/generic'
import { instanceOf } from '@kingjs/instance-of'

export const AllOf = genericType((...types) => {
  return class All extends Metadata {
    static types = Object.freeze(types)

    static [Symbol.hasInstance](value) {
      return this.types.every(type => instanceOf(value, type))
    }
  }
})

export const AnyOf = genericType((...types) => {
  return class Any extends Metadata {
    static types = Object.freeze(types)

    static [Symbol.hasInstance](value) {
      return this.types.some(type => instanceOf(value, type))
    }
  }
})
