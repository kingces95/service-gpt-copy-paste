import { Concept, Dispatch } from '../concept.js'
import { Preconditions } from '../debug-proxy.js'

export class CursorConcept extends Concept {
  step() { return this[Dispatch](
    CursorConcept, 'step') }
  next() { return this[Dispatch](
    CursorConcept, 'next') }
  equals(other) { return this[Dispatch](
    CursorConcept, 'equals', other) }
  equatableTo(other) { return this[Dispatch](
    CursorConcept, 'equatableTo', other) }
}

export class InputCursorConcept extends CursorConcept {
  get value() { return this[Dispatch](
    InputCursorConcept, 'value') }
}

export class OutputCursorConcept extends CursorConcept {
  set value(value) { return this[Dispatch](
    OutputCursorConcept, 'value', value) }
}

export class ForwardCursorConcept extends CursorConcept {
  clone() { return this[Dispatch](
    ForwardCursorConcept, 'clone') }
}

export class BidirectionalCursorConcept extends ForwardCursorConcept {
  stepBack() { return this[Dispatch](
    BidirectionalCursorConcept, 'stepBack') }
}

export class RandomAccessCursorConcept extends BidirectionalCursorConcept {
  static [Preconditions] = class extends BidirectionalCursorConcept[Preconditions] {
    compareTo(other) {
      if (!other) throwNull()
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    }
    subtract(other) {
      if (!other) throwNull()
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    }
  }

  move(offset) { return this[Dispatch](
    RandomAccessCursorConcept, 'move', offset) }
  at(offset) { return this[Dispatch](
    RandomAccessCursorConcept, 'at', offset) }
  setAt(offset, value) { return this[Dispatch](
    RandomAccessCursorConcept, 'setAt', offset, value) }
  compareTo(other) { return this[Dispatch](
    RandomAccessCursorConcept, 'compareTo', other) }
  subtract(other) { return this[Dispatch](
    RandomAccessCursorConcept, 'subtract', other) }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  static [Preconditions] = class extends RandomAccessCursorConcept[Preconditions] {
    data(other) {
      if (!other) throwNull()
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    }
  }

  data(other) { return this[Dispatch](
    ContiguousCursorConcept, 'data', other) }
  readAt(offset, length, signed, littleEndian) { 
    return this[Dispatch](
      ContiguousCursorConcept, 'readAt', ...arguments) 
  }
  
  // extension methods to be applied to cursor at load time
  read(length = 1, signed = false, littleEndian = false) {
    return this.readAt(0, length, signed, littleEndian)
  }

  readUInt8() { return this.read() }
  readInt8() { return this.read(1, true) }

  readUInt16(littleEndian = false) { return this.read(2, false, littleEndian) }
  readUInt16BE() { return this.readUInt16() }
  readUInt16LE() { return this.readUInt16(true) }
  
  readInt16(littleEndian = false) { return this.read(2, true, littleEndian) }
  readInt16BE() { return this.readInt16() }
  readInt16LE() { return this.readInt16(true) }

  readUInt32(littleEndian = false) { return this.read(4, false, littleEndian) }
  readUInt32BE() { return this.readUInt32() }
  readUInt32LE() { return this.readUInt32(true) }

  readInt32(littleEndian = false) { return this.read(4, true, littleEndian) }
  readInt32BE() { return this.readInt32() }
  readInt32LE() { return this.readInt32(true) }
}
