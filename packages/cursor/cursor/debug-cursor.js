import { Cursor } from './cursor.js'

export class DebugCursor extends Cursor {
  #__version

  constructor(version) {
    super()
    this.#__version = version
  }

  get __isActive$() { this.throwNotImplemented$() }
  get __version$() { return this.#__version }

  __throwStale$() { throw new Error(
    "Cursor is stale and cannot be used.") }

  get __isActive() { return this.__isActive$ }

  recycle$() {
    if (!this.__isActive) throw new Error(
      "Cursor cannot be recycled while still active.")
    this.#__version = this.__currentVersion$
  }

  get abilities() {
    if (!this.__isActive) this.__throwStale$()
    return super.abilities
  }
  get isEnd() {
    if (!this.__isActive) this.__throwStale$()
    return super.isEnd
  }
  get isBegin() {
    if (!this.__isActive) this.__throwStale$()
    return super.isBegin
  }
  get value() {
    if (!this.__isActive) this.__throwStale$()
    return super.value
  }
  set value(value) {
    if (!this.__isActive) this.__throwStale$()
    super.value = value
  }

  step() {
    if (!this.__isActive) this.__throwStale$()
    return super.step()
  }
  next() {
    if (!this.__isActive) this.__throwStale$()
    return super.next()
  }
  equals(other) {
    if (!this.__isActive) this.__throwStale$()
    return super.equals(other)
  }
  equatableTo(other) {
    if (!this.__isActive) this.__throwStale$()
    return super.equatableTo(other)
  }

  // forward cursor interface
  clone() {
    if (!this.__isActive) this.__throwStale$()
    return super.clone()
  }

  // bidirectional cursor interface
  stepBack() {
    if (!this.__isActive) this.__throwStale$()
    return super.stepBack()
  }

  // random access cursor interface
  at(offset) {
    if (!this.__isActive) this.__throwStale$()
    return super.at(offset)
  }
  subtract(other) {
    if (!this.__isActive) this.__throwStale$()
    return super.subtract(other)
  }
  compareTo(other) {
    if (!this.__isActive) this.__throwStale$()
    return super.compareTo(other)
  }
  read(length = 1, signed = false, littleEndian = false) {
    return super.read(length, signed, littleEndian)
  }
  readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
    if (!this.__isActive) this.__throwStale$()
    return super.readAt(offset, length, signed, littleEndian)
  }

  // contiguous cursor interface
  data(other) {
    if (!this.__isActive) this.__throwStale$()
    return super.data(other)
  }
}
