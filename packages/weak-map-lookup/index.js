export class WeakMapLookup {
  constructor(root = new WeakMap()) {
    this.root = root
  }

  get(keys) {
    let map = this.root

    for (const key of keys) {
      let next = map.get(key)

      if (!next) {
        next = new WeakMap()
        map.set(key, next)
      }

      map = next
    }

    return map
  }
}
