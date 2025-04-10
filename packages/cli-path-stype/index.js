import { IdentifierStyle } from '@kingjs/identifier-style'

export class CliPathStyle {
  static fromCamel(path = []) {
    return this.fromKabab(
      path.map(o => IdentifierStyle.fromKebab(o).toCamel())
    )
  }
  static fromKabab(path = []) {
    return new CliPathStyle(path)
  }

  #names

  constructor(names) {
    this.#names = names
  }

  toKabab() {
    return this.#names.map(o => IdentifierStyle.fromCamel(o).toKebab())
  }
  toCamel() {
    return this.#names
  }

  toString() {
    return this.toKabab().join(' ')
  }
}