import { Es6KeyInfo } from './es6-key-info.js'

// 'id' is short for 'identifier'

export class Es6IdInfo {
  static create(id) {
    if (id == null || id == '')
      return new Es6AnnonymousIdInfo()

    if (typeof id == 'string' || typeof id == 'symbol')
      return new Es6NamedIdInfo(id)

    return new Es6NamedIdInfo(id.toString())
  }

  get value() { return null }
  get isSymbol() { return false }
  get isString() { return false }
  get isAnonymous() { return false }
}

export class Es6NamedIdInfo extends Es6IdInfo {
  #_
  #keyInfo

  constructor(id) {
    super()
    this.#keyInfo = Es6KeyInfo.create(id)
    this.#_ = this.toString()
  }

  get value() { return this.#keyInfo.value }
  get isSymbol() { return this.#keyInfo.isSymbol }
  get isString() { return this.#keyInfo.isString }
  get isNonPublic() { return this.#keyInfo.isNonPublic }
  
  toString() { return this.#keyInfo.toString() }
}

export class Es6AnnonymousIdInfo extends Es6IdInfo {
  #_

  constructor() {
    super()
    this.#_ = this.toString()
  }

  get isAnonymous() { return true }
  get isNonPublic() { return true }
  toString() { return '<anonymous>' }
}