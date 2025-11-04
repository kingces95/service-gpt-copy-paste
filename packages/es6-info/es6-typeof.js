import { Descriptor } from "@kingjs/descriptor"

const {  
  get: getDescriptor,
  hasClassPrototypeDefaults,
} = Descriptor

export function es6Typeof(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'

  if (typeof value == 'function') {
    if (hasClassPrototypeDefaults(getDescriptor(value, 'prototype')))
      return 'class'
    return 'function'
  }

  return typeof value
}


