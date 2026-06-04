import { Metadata } from '@kingjs/metadata'
import { genericType } from '@kingjs/generic'
import { instanceOf } from '@kingjs/instance-of'
import { AnyOf } from './algebra.js'

export { AllOf, AnyOf } from './algebra.js'

export class AnyUndefined extends Metadata {
  static [Symbol.hasInstance](value) {
    return value === undefined
  }
}

export class AnyNull extends Metadata {
  static [Symbol.hasInstance](value) {
    return value === null
  }
}

export class AnyBoolean extends Metadata {
  static [Symbol.hasInstance](value) {
    return typeof value == 'boolean' || value instanceof Boolean
  }
}

export class AnyNumber extends Metadata {
  static [Symbol.hasInstance](value) {
    return typeof value == 'number' || value instanceof Number
  }
}

export class AnyBigInt extends Metadata {
  static [Symbol.hasInstance](value) {
    return typeof value == 'bigint'
  }
}

export class AnyString extends Metadata {
  static [Symbol.hasInstance](value) {
    return typeof value == 'string' || value instanceof String
  }
}

export class AnySymbol extends Metadata {
  static [Symbol.hasInstance](value) {
    return typeof value == 'symbol'
  }
}

export class AnyFunction extends Metadata {
  static [Symbol.hasInstance](value) {
    return typeof value == 'function'
  }
}

export class AnyObject extends Metadata {
  static [Symbol.hasInstance](value) {
    return value != null && typeof value == 'object'
  }
}

export class AnyNonNullish extends Metadata {
  static [Symbol.hasInstance](value) {
    return value != null
  }
}

export class NormalNumber extends Metadata {
  static [Symbol.hasInstance](value) {
    return Number.isInteger(value) && value >= 0
  }
}

export const OptionalOf = genericType(Type => {
  return class Optional extends Metadata {
    static Type = AnyOf(AnyUndefined, Type)

    static [Symbol.hasInstance](value) {
      return value instanceof this.Type
    }
  }
})

export const ConstructsOf = genericType(Type => {
  return class Constructs extends Metadata {
    static Type = Type

    static [Symbol.hasInstance](value) {
      return value?.prototype instanceof this.Type
    }
  }
})
