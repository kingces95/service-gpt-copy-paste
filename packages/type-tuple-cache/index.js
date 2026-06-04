import { WeakMapLookup } from '@kingjs/weak-map-lookup'

const Value = { }

export class TypeTupleCache {
  #root = new WeakMapLookup()

  has(types) {
    return this.#root.of(...types).has(Value)
  }

  get(types) {
    return this.#root.of(...types).get(Value)
  }

  set(types, value) {
    this.#root.of(...types).set(Value, value)
    return value
  }

  getOrCreate(types, create) {
    const leaf = this.#root.of(...types)

    if (leaf.has(Value))
      return leaf.get(Value)

    const value = create()
    leaf.set(Value, value)
    return value
  }
}
