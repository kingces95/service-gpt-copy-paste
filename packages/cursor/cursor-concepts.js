import { 
  Implements,
  EquatableConcept } from '@kingjs/concept'
import { Extends } from '@kingjs/partial-class'
import { throwNotEquatableTo } from './throw.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { 
  throwMoveOutOfBounds, 
  throwReadOutOfBounds, 
  throwWriteOutOfBounds } from './throw.js'
import { write } from 'fast-csv'

export class CursorConcept extends EquatableConcept {
  static [Preconditions] = {
    step() { 
      if (this.equals(this.range.end({ constant: true }))) 
        throwMoveOutOfBounds() 
    },
  }
  
  static [Extends] = {
    equatableTo(other) {
      if (other?.constructor != this.constructor) return false
      return this.range == other.range
    },
    next() {
      const value = this.value 
      if (!this.step()) return
      return value
    }
  }

  get range() { }
  step() { }
}

export class InputCursorConcept extends CursorConcept {
  static [Preconditions] = {
    get value() { 
      if (this.equals(this.range.end({ constant: true })))
        throwReadOutOfBounds()
    },
  }

  get value() { }
}

export class OutputCursorConcept extends CursorConcept {
  static [Preconditions] = {
    set value(value) { 
      if (this.equals(this.range.end({ constant: true })))
        throwWriteOutOfBounds()
    },
  }
  
  set value(value) { }
}

export class MutableCursorConcept extends CursorConcept {
  static [Implements] = [ InputCursorConcept, OutputCursorConcept ]
}

export class ForwardCursorConcept extends InputCursorConcept {
  clone() { }
}

export class BidirectionalCursorConcept extends ForwardCursorConcept {
  static [Preconditions] = {
    stepBack() { 
      const { range } = this
      if (range.beforeBegin) {
        // if (this.equals(container.beforeBegin({ constant: true })))
        //   throwMoveOutOfBounds()
        // else 
        if (this.equals(range.begin({ constant: true })))
          throwMoveOutOfBounds()
      }
    }
  }

  stepBack() { }
}

export class RandomAccessCursorConcept extends BidirectionalCursorConcept {
  static [Preconditions] = {
    compareTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    subtract(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    move(offset) {
      const { range } = this
      const begin = range.begin({ constant: true })
      const end = range.end({ constant: true })
      const count = end.subtract(begin)
      offset += this.index
      if (offset < 0) throwMoveOutOfBounds()
      if (offset > count) throwMoveOutOfBounds()
    },
  }

  move(offset) { }
  at(offset) { }
  setAt(offset, value) { }
  compareTo(other) { }
  subtract(other) { }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  static [Preconditions] = {
    data(begin, end) {
      if (!this.equatableTo(begin)) throwNotEquatableTo()
      if (!this.equatableTo(end)) throwNotEquatableTo()
    }
  }

  static [Extends] = {
    read(length = 1, signed = false, littleEndian = false) {
      return this.readAt(0, length, signed, littleEndian)
    },
    write(value, length = 1, signed = false, littleEndian = false) {
      return this.writeAt(0, value, length, signed, littleEndian)
    },

    // 8 bit
    readUInt8() { return this.read() },
    readInt8() { return this.read(1, true) },
    writeUInt8(value) { return this.write(value) },
    writeInt8(value) { return this.write(value, 1, true) },
  
    // 16 bit unsigned
    readUInt16(littleEndian = false) { 
      return this.read(2, false, littleEndian) },
    readUInt16BE() { return this.readUInt16() },
    readUInt16LE() { return this.readUInt16(true) },
    writeUInt16(value, littleEndian = false) { 
      return this.write(value, 2, false, littleEndian) },
    writeUInt16BE(value) { return this.writeUInt16(value) },
    writeUInt16LE(value) { return this.writeUInt16(value, true) },
    
    // 16 bit signed
    readInt16(littleEndian = false) { 
      return this.read(2, true, littleEndian) },
    readInt16BE() { return this.readInt16() },
    readInt16LE() { return this.readInt16(true) },
    writeInt16(value, littleEndian = false) { 
      return this.write(value, 2, true, littleEndian) },
    writeInt16BE(value) { return this.writeInt16(value) },
    writeInt16LE(value) { return this.writeInt16(value, true) },
  
    // 32 bit unsigned
    readUInt32(littleEndian = false) { 
      return this.read(4, false, littleEndian) },
    readUInt32BE() { return this.readUInt32() },
    readUInt32LE() { return this.readUInt32(true) },
    writeUInt32(value, littleEndian = false) { 
      return this.write(value, 4, false, littleEndian) },
    writeUInt32BE(value) { return this.writeUInt32(value) },
    writeUInt32LE(value) { return this.writeUInt32(value, true) },
  
    // 32 bit signed
    readInt32(littleEndian = false) { 
      return this.read(4, true, littleEndian) },
    readInt32BE() { return this.readInt32() },
    readInt32LE() { return this.readInt32(true) },
    writeInt32(value, littleEndian = false) { 
      return this.write(value, 4, true, littleEndian) },
    writeInt32BE(value) { return this.writeInt32(value) },
    writeInt32LE(value) { return this.writeInt32(value, true) },
  }

  data(begin, end) { }
  readAt(offset, length, signed, littleEndian) { }
  writeAt(offset, value, length, signed, littleEndian) { }
}
