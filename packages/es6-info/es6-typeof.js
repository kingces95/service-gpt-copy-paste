import { Es6Descriptor } from "./es6-descriptor.js"

const { hasClassPrototypeDefaults } = Es6Descriptor

export function es6Typeof(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'

  if (typeof value == 'function') {
    const prototypeDescriptor =
      Object.getOwnPropertyDescriptor(value, 'prototype')

    if (hasClassPrototypeDefaults(prototypeDescriptor))
      return 'class'

    return 'function'
  }

  return typeof value
}
