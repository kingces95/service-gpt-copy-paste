import { assert } from '@kingjs/assert'

export class Es6KeyInfo {
  static isNonPublic(name) { 
    if (typeof name === 'symbol') return false
    if (!name) return false

    if (name.startsWith('_')) return true
    if (name.endsWith('_')) return true
    if (name.startsWith('$')) return true
    if (name.endsWith('$')) return true
    return false
  }

  static create(key) {
    if (typeof key === 'symbol')
      return new Es6SymbolKeyInfo(key)
    return new Es6StringKeyInfo(key)
  }
  
  #key

  constructor(key) {
    if (!key) key = null
    this.#key = key
  }

  get value() { return this.#key }
  get isSymbol() { return false }
  get isString() { return false }
  get isNonPublic() { 
    return Es6KeyInfo.isNonPublic(this.value)
  }

  equals(other) {
    if (!(other instanceof Es6KeyInfo)) return false
    return this.value === other.value
  }
}

export class Es6StringKeyInfo extends Es6KeyInfo {
  constructor(key) {
    assert(typeof key == 'string')
    super(key)
  }

  get isString() { return true }

  toString() { return this.value }
}

export class Es6SymbolKeyInfo extends Es6KeyInfo {
  constructor(key) {
    assert(typeof key == 'symbol')
    super(key)
  }

  get isSymbol() { return true }

  toString() { return `[${this.value.toString()}]` }
}
