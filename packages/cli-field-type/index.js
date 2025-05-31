import assert from 'assert'
import { isPojo } from '@kingjs/pojo-test'

export class CliFieldType {
  static getType(type) {
    switch (type) {
      case 'word':
      case '?':
        return CliFieldType.word
      case 'number':
      case '#':
        return CliFieldType.number
      case 'boolean':
      case '!':
        return CliFieldType.boolean
      case 'comment':
      case '*':
        return CliFieldType.comment
      case 'any':
        return CliFieldType.any
      default:
        if (isPojo(type))
          // behaves like a word at runtime; is word + added metadata
          return CliEnumFieldType.loadEnum(Object.keys(type))
        throw new Error(`Unknown field type '${type}'`)
    }
  }

  static get number() { return CliNumberFieldType.instance }
  static get boolean() { return CliBooleanFieldType.instance }
  static get word() { return CliWordFieldType.instance }
  static get comment() { return CliCommentFieldType.instance }
  static get any() { return CliAnyFieldType.instance }

  get isAny() { return false }
  get isEnum() { return false }
  get isNumber() { return false }
  get isBoolean() { return false }
  get isWord() { return false }
  get isComment() { return false }
  get isLiteral() { return false }
  get name() { }
  get alias() { }

  *values() { }
  has(value) { return false }
  parse() { }
}
class CliAnyFieldType extends CliFieldType {
  static instance = new CliAnyFieldType()
  // The client should expect the value stored in this location could be 
  // string, number, boolean, or an array or object which is typed by context 
  // enternal to this class.

  // The motivation for the any type is to follow the enum type and have the
  // enum supply its type. 

  // For example:
  //  [ { a: '#, b: '?' } ] and line 'a 42' => [ 'a', '42' ] or
  //  { type: { a: '#, b: '?' } } and line 'a 42' => { type: 'a', _: '42' }
  get isAny() { return true }
  get name() { return 'any' }
  get alias() { return null }
  parse(value) {
    throw new Error('Cannot parse any type. Use a more specific type.')
  }
}
class CliLiteralFieldType extends CliFieldType {
  get isLiteral() { return true }
}
class CliStringLiteralFieldType extends CliLiteralFieldType {
  parse(value) {
    if (value == null) return ''
    return value
  }
}
class CliWordFieldType extends CliStringLiteralFieldType {
  static instance = new CliWordFieldType()
  get isWord() { return true }
  get name() { return 'word' }
  get alias() { return '?' }
}

class CliEnumFieldType extends CliStringLiteralFieldType {
  static loadEnum(values) {
    assert(Array.isArray(values), 'Enum values must be an array')
    const sortedNames = values.slice().sort()
    const key = sortedNames.join(',')
    if (!CliEnumFieldType.#cache.has(key))
      CliEnumFieldType.#cache.set(key, new CliEnumFieldType(sortedNames))  
    return CliEnumFieldType.#cache.get(key)
  }
  static #cache = new Map()

  #values
  constructor(values) {
    super()
    this.#values = new Set(values)
  }
  get isEnum() { return true }
  get name() { return 'enum' }
  get alias() { return null }

  *values() { yield* this.#values }
  has(value) { return this.#values.has(value) }
}
class CliNumberFieldType extends CliLiteralFieldType {
  static instance = new CliNumberFieldType()
  get isNumber() { return true }
  get name() { return 'number' }
  get alias() { return '#' }
  parse(value) {
    if (value == null) return NaN
    if (value == '') return NaN
    return Number(value)
  }
}
class CliBooleanFieldType extends CliLiteralFieldType {
  static instance = new CliBooleanFieldType()
  get isBoolean() { return true }
  get name() { return 'boolean' }
  get alias() { return '!' }
  parse(value) {
    if (value == null) return false
    if (value === '') return false
    if (value === '0') return false
    if (value === 'false') return false
    if (value === 'False') return false
    return true
  }
}
class CliCommentFieldType extends CliFieldType {
  static instance = new CliCommentFieldType()
  get isComment() { return true }
  get name() { return 'comment' }
  get alias() { return '*' }
  parse(value) {
    if (value == null) return ''
    return value
  }
}