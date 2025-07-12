import { CursorAbility as Ability } from './cursor-abilitiy.js'
import {
  throwNotImplemented,
  throwNull,
  throwNotEquatableTo,
  throwReadOnly,
  throwNotInput,
  throwNotOutput,
  throwNotForward,
  throwNotBidirectional,
  throwNotRandomAccess,
  throwNotContiguous,
} from '../throw.js'

export class Cursor {
  static get Ability() { return Ability }

  static get abilities() { throwNotImplemented() }
  static get isInput() { return Ability.isInput(this.abilities) }
  static get isOutput() { return Ability.isOutput(this.abilities) }
  static get isForward() { return Ability.isForward(this.abilities) }
  static get isBidirectional() { return Ability.isBidirectional(this.abilities) }
  static get isRandomAccess() { return Ability.isRandomAccess(this.abilities) }
  static get isContiguous() { return Ability.isContiguous(this.abilities) }

  #readOnly

  constructor() {
    this.isReadOnly = false // default to writable
  }

  // universal cursor interface
  get abilities() { return this.constructor.abilities }
  get value$() { throwNotImplemented() }
  set value$(value) { throwNotImplemented() }
  step$() { throwNotImplemented() }
  next$() {
    const value = this.value 
    if (!this.step()) return
    return value
  }
  equals$(other) { throwNotImplemented() }
  equatableTo$(other) { throwNotImplemented() }

  // forward cursor interface
  clone$() { throwNotImplemented() }

  // bidirectional cursor interface
  stepBack$() { throwNotImplemented() }

  // random access cursor interface
  move$(offset) { throwNotImplemented}
  at$(offset) { throwNotImplemented() }
  setAt$(offset, value) { throwNotImplemented() }
  subtract$(other) { throwNotImplemented() }
  compareTo$(other) { throwNotImplemented() }
  
  // contiguous cursor interface
  readAt$(offset = 0, length = 1, signed = false, littleEndian = false) {
    throwNotImplemented()
  }
  data$(other) { throwNotImplemented() }

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
  get value() {
    if (!this.isInput) throwNotInput()
    return this.value$ 
  }
  set value(value) {
    if (this.isReadOnly) throwReadOnly()
    if (!this.isOutput) throwNotOutput()
    this.value$ = value
  }

  next() { return this.next$() }
  step() {
    return this.step$() 
  }
  equals(other) {
    if (!other) throwNull()
    if (!this.equatableTo(other)) throwNotEquatableTo(other)
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
    if (!this.isForward) throwNotForward()
    return this.clone$()
  }

  // bidirectional cursor interface
  stepBack() { 
    if (!this.isBidirectional) throwNotBidirectional()
    return this.stepBack$()
  }

  // random access cursor interface
  move(offset) {
    if (!this.isRandomAccess) throwNotRandomAccess()
    if (offset == 0) return true
    return this.move$(offset)
  }
  at(offset) { 
    if (!this.isRandomAccess) throwNotRandomAccess()
    return this.at$(offset)
  }
  setAt(offset, value) {
    if (!this.isRandomAccess) throwNotRandomAccess()
    if (this.isReadOnly) throwReadOnly()
    this.setAt$(value, offset)
  }
  subtract(other) { 
    if (!this.isRandomAccess) throwNotRandomAccess()
    if (!other) throwNull()
    if (!this.equatableTo(other)) throwNotEquatableTo(other)
    return this.subtract$(other)
  }
  compareTo(other) { 
    if (!this.isRandomAccess) throwNotRandomAccess()
    if (!other) throwNull()
    if (!this.equatableTo(other)) throwNotEquatableTo(other)
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
    if (!this.isContiguous) throwNotContiguous()
    return this.readAt$(offset, length, signed, littleEndian)
  }
  data(other) {
    if (!this.isContiguous) throwNotContiguous()
    if (!other) throwNull()
    if (!this.equatableTo(other)) throwNotEquatableTo(other)
    return this.data$(other)
  }
}
