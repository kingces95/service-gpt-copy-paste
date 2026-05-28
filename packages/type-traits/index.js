import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { declareName } from '@kingjs/es6-define'

export function sameAs(type) {
  class SameAs {
    static [Symbol.hasInstance](value) {
      return value == type
    }
  }

  return declareName(SameAs, `SameAs${type.name}`)
}

export function extensionOf(
  type,
  { strict = false, reflector = Es6UserReflect } = { }
) {
  class ExtensionOf {
    static [Symbol.hasInstance](value) {
      return reflector.isExtensionOf(value, type, {
        minDepth: strict ? 1 : 0,
      })
    }
  }

  return declareName(
    ExtensionOf,
    `${strict ? 'Strict' : ''}ExtensionOf${type.name}`
  )
}

export const derivedFrom = extensionOf

export function baseOf(type, options) {
  return extensionOf(type, { strict: false, ...options })
}
