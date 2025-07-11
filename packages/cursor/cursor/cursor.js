import { CursorAbility as Ability } from './cursor-abilitiy.js'

export class Cursor {
  static get Ability() { return Ability }

  static get abilities() { Cursor.throwNotImplemented$() }
  static get isInput() { return Ability.isInput(this.abilities) }
  static get isOutput() { return Ability.isOutput(this.abilities) }
  static get isForward() { return Ability.isForward(this.abilities) }
  static get isBidirectional() { return Ability.isBidirectional(this.abilities) }
  static get isRandomAccess() { return Ability.isRandomAccess(this.abilities) }
  static get isContiguous() { return Ability.isContiguous(this.abilities) }

  static throwUnsupported$() { throw new Error(
    'Operation requires advanced cursor type.')
  }
  static throwNotImplemented$() { throw new Error(
    'Not implemented.')
  }

  #readOnly

  constructor() {
    this.isReadOnly = false // default to writable
  }

  throwUnsupported$() { Cursor.throwUnsupported$() }
  throwNotImplemented$() { Cursor.throwNotImplemented$() }
  throwNull$() { throw new TypeError(
    'Cursor cannot be null or undefined.') }
  throwNotEquatableTo$() { throw new TypeError(
    'Cursor is not equatable to the other cursor.') }
  throwReadOnly$() { throw new Error(
    'Cursor is read-only.') }
  throwNotInput$() { throw new Error(
    'Operation requires an input cursor.') }
  throwNotOutput$() { throw new Error(
    'Operation requires an output cursor.') }
  throwNotForward$() { throw new Error(
    'Operation requires a forward cursor.') }
  throwNotBidirectional$() { throw new Error(
    'Operation requires a bidirectional cursor.') }
  throwNotRandomAccess$() { throw new Error(
    'Operation requires a random access cursor.') }
  throwNotContiguous$() { throw new Error(
    'Operation requires a contiguous cursor.') }

  // universal cursor interface
  get abilities() { return this.constructor.abilities }
  get isEnd$() { this.throwNotImplemented$() }
  get isBegin$() { this.throwNotImplemented$() }
  get isBeforeBegin$() { this.throwNotImplemented$() }
  get value$() { this.throwNotImplemented$() }
  set value$(value) { this.throwNotImplemented$() }
  step$() { this.throwNotImplemented$() }
  next$() {
    const value = this.value 
    if (!this.step()) return
    return value
  }
  equals$(other) { this.throwNotImplemented$() }
  equatableTo$(other) { this.throwNotImplemented$() }

  // forward cursor interface
  clone$() { this.throwNotImplemented$() }

  // bidirectional cursor interface
  stepBack$() { this.throwNotImplemented$() }

  // random access cursor interface
  move$(offset) { this.throwNotImplemented$}
  at$(offset) { this.throwNotImplemented$() }
  setAt$(offset, value) { this.throwNotImplemented$() }
  subtract$(other) { this.throwNotImplemented$() }
  compareTo$(other) { this.throwNotImplemented$() }
  
  // contiguous cursor interface
  readAt$(offset = 0, length = 1, signed = false, littleEndian = false) {
    this.throwNotImplemented$()
  }
  data$(other) { this.throwNotImplemented$() }

  recycle$() { this.#readOnly = false }

  get Ability() { return Ability }
  get abilities() {
    let abilities = this.constructor.abilities
    // clear output ability if read-only
    if (this.isReadOnly)
      abilities &= ~Cursor.Ability.Output
    return abilities
  }
  get isInput() { return this.constructor.isInput }
  get isOutput() { return this.constructor.isOutput }
  get isForward() { return this.constructor.isForward }
  get isBidirectional() { return this.constructor.isBidirectional }
  get isRandomAccess() { return this.constructor.isRandomAccess }
  get isContiguous() { return this.constructor.isContiguous }

  get isReadOnly() { return this.#readOnly }
  set isReadOnly(value) {
    if (typeof value !== 'boolean') 
      throw new TypeError('isReadOnly must be a boolean.')
    if (this.isReadOnly && !value)
      throw new Error('Cannot make read-only cursor writable.')
    this.#readOnly = value
  }
  
  // universal cursor interface
  get isEnd() { return this.isEnd$ }
  get isBegin() { return this.isBegin$ }
  get isBeforeBegin() { return this.isBeforeBegin$ }
  get value() {
    if (!this.isInput) this.throwNotInput$()
    return this.value$ 
  }
  set value(value) {
    if (this.isReadOnly) this.throwReadOnly$()
    if (!this.isOutput) this.throwNotOutput$()
    this.value$ = value
  }

  next() { return this.next$() }
  step() {
    return this.step$() 
  }
  equals(other) {
    if (!other) this.throwNull$()
    if (!this.equatableTo(other)) this.throwNotEquatableTo$(other)
    return this.equals$(other)
  }
  equatableTo(other) {
    if (this === other) return true
    if (!other) return false
    if (other.constructor != this.constructor) return false
    if (this.isReadOnly != other.isReadOnly) return false
    return this.equatableTo$(other)
  }

  // forward cursor interface
  clone() { 
    if (!this.isForward) this.throwNotForward$()
    return this.clone$()
  }

  // bidirectional cursor interface
  stepBack() { 
    if (!this.isBidirectional) this.throwNotBidirectional$()
    return this.stepBack$()
  }

  // random access cursor interface
  move(offset) {
    if (!this.isRandomAccess) this.throwNotRandomAccess$()
    if (offset == 0) return true
    return this.move$(offset)
  }
  at(offset) { 
    if (!this.isRandomAccess) this.throwNotRandomAccess$()
    return this.at$(offset)
  }
  setAt(offset, value) {
    if (!this.isRandomAccess) this.throwNotRandomAccess$()
    if (this.isReadOnly) this.throwReadOnly$()
    this.setAt$(value, offset)
  }
  subtract(other) { 
    if (!this.isRandomAccess) this.throwNotRandomAccess$()
    if (!other) this.throwNull$()
    if (!this.equatableTo(other)) this.throwNotEquatableTo$(other)
    return this.subtract$(other)
  }
  compareTo(other) { 
    if (!this.isRandomAccess) this.throwNotRandomAccess$()
    if (!other) this.throwNull$()
    if (!this.equatableTo(other)) this.throwNotEquatableTo$(other)
    return this.compareTo$(other)
  }

  // contiguous cursor interface
  readUInt8() { return this.read() }
  readInt8() { return this.read(1, true) }

  readUInt16(littleEndian = false) { 
    return this.read(2, false, littleEndian) 
  }
  readUInt16BE() { return this.readUInt16() }
  readUInt16LE() { return this.readUInt16(true) }
  
  readInt16(littleEndian = false) { 
    return this.read(2, true, littleEndian) 
  }
  readInt16BE() { return this.readInt16() }
  readInt16LE() { return this.readInt16(true) }

  readUInt32(littleEndian = false) { 
    return this.read(4, false, littleEndian) 
  }
  readUInt32BE() { return this.readUInt32() }
  readUInt32LE() { return this.readUInt32(true) }

  readInt32(littleEndian = false) { 
    return this.read(4, true, littleEndian) 
  }
  readInt32BE() { return this.readInt32() }
  readInt32LE() { return this.readInt32(true) }

  read(length = 1, signed = false, littleEndian = false) {
    return this.readAt(0, length, signed, littleEndian)
  }
  readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
    if (!this.isContiguous) this.throwNotContiguous$()
    return this.readAt$(offset, length, signed, littleEndian)
  }
  data(other) {
    if (!this.isContiguous) this.throwNotContiguous$()
    if (!other) this.throwNull$()
    if (!this.equatableTo(other)) this.throwNotEquatableTo$(other)
    return this.data$(other)
  }
}
