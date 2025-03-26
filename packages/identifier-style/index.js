const ALNUM = /^[a-z0-9]+$/i
const CAMEL = /^[a-z]+(?:[A-Z][a-z0-9]*)+$/
const PASCAL = /^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$/
const FLAT = /^[a-z][a-z0-9]*$/

export class IdentifierStyle {
  // from camelCase
  static fromCamel(value) {
    if (!IdentifierStyle.isCamel(value)) {
      throw new Error(`Expected camel or flat case input, got: "${value}"`)
    }
    const parts = value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(' ')
    return new IdentifierStyle(parts)
  }

  // from PascalCase
  static fromPascal(value) {
    if (!IdentifierStyle.isPascal(value)) {
      throw new Error(`Expected PascalCase input, got: "${value}"`)
    }
    const parts = value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/^([A-Z])/, ' $1')
      .trim()
      .toLowerCase()
      .split(' ')
    return new IdentifierStyle(parts)
  }

  // from snake_case
  static fromSnake(value) {
    if (!IdentifierStyle.isSnake(value)) {
      throw new Error(`Expected snake_case or flat case input, got: "${value}"`)
    }
    return new IdentifierStyle(value.split('_'))
  }

  // from kebab-case
  static fromKebab(value) {
    if (!IdentifierStyle.isKebab(value)) {
      throw new Error(`Expected kebab-case or flat case input, got: "${value}"`)
    }
    return new IdentifierStyle(value.split('-'))
  }

  // from flat
  static fromFlat(value) {
    if (!IdentifierStyle.isFlat(value)) {
      throw new Error(`Expected flat case input, got: "${value}"`)
    }
    return new IdentifierStyle([value])
  }

  // detect identifier type
  static typeof(value) {
    if (FLAT.test(value)) return 'flat'
    if (value.includes('_')) return 'snake'
    if (value.includes('-')) return 'kebab'
    if (CAMEL.test(value)) return 'camel'
    if (PASCAL.test(value)) return 'pascal'
    return 'unknown'
  }

  // static helpers
  static isCamel(value) {
    const type = IdentifierStyle.typeof(value)
    return type === 'camel' || type === 'flat'
  }

  static isPascal(value) {
    return IdentifierStyle.typeof(value) === 'pascal'
  }

  static isSnake(value) {
    const type = IdentifierStyle.typeof(value)
    return type === 'snake' || type === 'flat'
  }

  static isKebab(value) {
    const type = IdentifierStyle.typeof(value)
    return type === 'kebab' || type === 'flat'
  }

  static isFlat(value) {
    return IdentifierStyle.typeof(value) === 'flat'
  }

  static is(type, value) {
    switch (type) {
      case 'camel': return IdentifierStyle.isCamel(value)
      case 'pascal': return IdentifierStyle.isPascal(value)
      case 'snake': return IdentifierStyle.isSnake(value)
      case 'kebab': return IdentifierStyle.isKebab(value)
      case 'flat': return IdentifierStyle.isFlat(value)
      default: return false
    }
  }

  // auto-detect and parse identifier
  static from(value) {
    switch (IdentifierStyle.typeof(value)) {
      case 'camel': return IdentifierStyle.fromCamel(value)
      case 'pascal': return IdentifierStyle.fromPascal(value)
      case 'snake': return IdentifierStyle.fromSnake(value)
      case 'kebab': return IdentifierStyle.fromKebab(value)
      case 'flat': return IdentifierStyle.fromFlat(value)
      default: throw new Error(`Unknown identifier format for input: "${value}"`)
    }
  }

  constructor(parts) {
    const invalid = parts.filter(p => !ALNUM.test(p))
    if (invalid.length > 0) {
      throw new Error([
        `Invalid identifier parts: [${invalid.join(', ')}].`,
        `All parts must be alphanumeric.`].join(' '))
    }
    this.parts = parts.map(p => p.toLowerCase())
  }

  // to camelCase
  toCamel() {
    return this.parts
      .map((word, i) => i === 0 ? word : word[0].toUpperCase() + word.slice(1))
      .join('')
  }

  // to PascalCase
  toPascal() {
    return this.parts
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join('')
  }

  // to snake_case
  toSnake() {
    return this.parts.join('_')
  }

  // to kebab-case
  toKebab() {
    return this.parts.join('-')
  }

  to(type) {
    switch (type) {
      case 'camel': return this.toCamel()
      case 'pascal': return this.toPascal()
      case 'snake': return this.toSnake()
      case 'kebab': return this.toKebab()
      default: throw new Error(`Unknown target format: "${type}"`)
    }
  }

  // default string representation
  toString() {
    return this.toKebab()
  }
}
