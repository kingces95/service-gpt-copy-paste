import { Descriptor, DataDescriptor } from '@kingjs/descriptor'

// hasClassPrototypeDefaults checks if a prototype descriptor of a function
// has a particular set of defaults which can be used to loosly determine 
// if a class was declared using the class syntax. The defaults are:
//  - enumerable: false, configurable: false, writable: false
function hasClassPrototypeDefaults(descriptor) {
  if (!descriptor) return false

  const type = Descriptor.typeof(descriptor)
  if (type != DataDescriptor.Type) return false

  if (descriptor.enumerable) return false
  if (descriptor.configurable) return false
  if (descriptor.writable) return false
  return true
}

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
