import { Concept, Stub } from '@kingjs/concept'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNull,
  throwNotEquatableTo,
} from './throw.js'

export class CursorConcept extends Concept {
  static [Preconditions] = Concept

  step() { return this[Stub](
    CursorConcept, 'step') }
  next() { return this[Stub](
    CursorConcept, 'next') }
  equals(other) { return this[Stub](
    CursorConcept, 'equals', other) }
  equatableTo(other) { return this[Stub](
    CursorConcept, 'equatableTo', other) }
}

export class InputCursorConcept extends CursorConcept {
  get value() { return this[Stub](
    InputCursorConcept, 'value') }
}

export class OutputCursorConcept extends CursorConcept {
  set value(value) { return this[Stub](
    OutputCursorConcept, 'value', value) }
}

export class ForwardCursorConcept extends CursorConcept {
  clone() { return this[Stub](
    ForwardCursorConcept, 'clone') }
}

export class BidirectionalCursorConcept extends ForwardCursorConcept {
  stepBack() { return this[Stub](
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

  move(offset) { return this[Stub](
    RandomAccessCursorConcept, 'move', offset) }
  at(offset) { return this[Stub](
    RandomAccessCursorConcept, 'at', offset) }
  setAt(offset, value) { return this[Stub](
    RandomAccessCursorConcept, 'setAt', offset, value) }
  compareTo(other) { return this[Stub](
    RandomAccessCursorConcept, 'compareTo', other) }
  subtract(other) { return this[Stub](
    RandomAccessCursorConcept, 'subtract', other) }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  static [Preconditions] = class extends RandomAccessCursorConcept[Preconditions] {
    data(other) {
      if (!other) throwNull()
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    }
  }

  data(other) { return this[Stub](
    ContiguousCursorConcept, 'data', other) }
  readAt(offset, length, signed, littleEndian) { 
    return this[Stub](
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
