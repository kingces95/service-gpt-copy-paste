// A class which tracks a refernce count for an arbitrary object
// When the reference count reaches zero, the object is removed
// from the map. Call addRef and release to add and remove references.
// Each function returns the current reference count for the object.

class CliRefCounter {
  #refs = new Map()

  constructor(...objects) {
    for (const object of objects) {
      if (!object) throw new TypeError('Invalid object.')
      this.addRef(object)
    }
  }

  addRef(object) {
    const count = this.#refs.get(object) ?? 0
    this.#refs.set(object, count + 1)
    return count + 1
  }

  release(object) {
    const count = this.#refs.get(object) ?? 0
    if (count === 0) 
      throw new Error('Cannot release reference to object that is not referenced.')
    if (count === 1) this.#refs.delete(object)
    else this.#refs.set(object, count - 1)
    return count - 1
  }
}
