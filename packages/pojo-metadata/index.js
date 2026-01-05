import assert from 'assert'
import { es6BaseType } from '@kingjs/es6-base-type'

// PojoMetadata is a map of type to pojo metadata where the prototype
// of each pojo is the pojo metadata of the prototype of the key type.

// PojoMetadata has a single operator load(type, [pojo]) which loads
// the pojo metadata for the given type. If pojo is provided, it is used
// to initialize the pojo metadata for the type. Otherwise, if no pojo
// is provided, the pojo metadata is inherited from the prototype type.
// If the type already has pojo metadata, and a pojo is provided, an
// error is thrown.

// PojoMetadata can be initialized with an array of [type, pojo] pairs.

export class PojoMetadata {
  #map = new Map()

  constructor(metadata = []) {
    for (const [type, pojo] of metadata)
      this.set(type, pojo)
  }

  get(type) {
    if (!this.has(type))
      this.set(type, { })
    return this.#map.get(type)
  }

  has(type) {
    return this.#map.has(type)
  }

  set(type, pojo = { }) {
    assert(typeof type == 'function', 
      'type must be a constructor function.')

    if (this.#map.has(type)) throw new Error(
      `Pojo metadata for type ${type.name} already exists.`)

    const baseType = es6BaseType(type)
    const prototype = baseType ? this.get(baseType) : { }
    const metadata = { ...prototype }
    Object.assign(metadata, pojo)
    this.#map.set(type, metadata)
  }
}
