import { ContainerCursor } from '../container-cursor.js'

// SequenceCursor is an abstract class that represents a cursor
// for a sequence container. It provides a common interface for
// iterating over the elements in the sequence. It is not meant to be
// instantiated directly, but rather to be extended by other classes.
export class SequenceCursor extends ContainerCursor {
  #index

  constructor(sequence, index) {
    super(sequence)
    this.#index = index
  }

  get sequence$() { return this.container$ }
  get index$() { return this.#index }

  recycle$(sequence, index) {
    super.recycle$(sequence, index)
    this.#index = index
    return this
  }

  get isRandomAccess() { return true }

  get isEnd() {
    this.__throwIfStale$()
    const { sequence$: sequence, index$: index } = this
    return index === sequence.count
  }
  get isBegin() {
    this.__throwIfStale$()
    const { index$: index } = this
    return index === 0
  }
  get value() {
    if (this.isEnd) return undefined
    const { sequence$: sequence, index$: index } = this
    return sequence.at(index)
  }
  set value(value) {
    this.__throwIfStale$()
    this.throwIfReadOnly$()
    const { sequence$: sequence, index$: index } = this
    if (this.isEnd) throw new RangeError(`Cannot set value at end of sequence.`)
    sequence.set(index, value)
  }

  data(other) {
    this.__throwIfStale$()
    return null
  }

  subtract(other) {
    this.__throwIfStale$()
    this.throwIfNotEquatable$(other)
    const { index$: index } = this
    const otherIndex = other.index$
    return index - otherIndex
  }

  next() {
    if (this.isEnd) return undefined
    this.#index++
    return sequence.at(index)
  }

  at(offset) {
    super.at(offset)
    const { sequence$: sequence, index$: index } = this
    const offsetIndex = index + offset
    if (offsetIndex < 0 || offsetIndex >= sequence.count)
      throw new RangeError(`Index out of bounds.`)
    return sequence.at(offsetIndex)
  }

  step(offset = 1) {
    this.__throwIfStale$()
    if (offset == 0) return true
    if (offset < 0) return this.stepBack(-offset)

    if (this.#index + offset > this.sequence$.count) return false
    if (this.isEnd) return false
    this.#index += offset
    return true
  }

  stepBack(offset = 1) {
    this.__throwIfStale$()
    if (offset == 0) return true
    if (offset < 0) return this.step(-offset)

    if (this.#index - offset < 0) return false
    if (this.isBegin) return false
    this.#index -= offset
    return true
  }

  equals(other) {
    this.__throwIfStale$()
    if (!(other instanceof this.constructor)) return false

    const { container$: container } = this
    if (other.container$ !== container) return false

    const { index$: index } = this
    return other.index$ === index
  }

  compare(other) {
    this.__throwIfStale$()
    throwIfNotEquatable$(other)
    const { index$: index } = this
    const otherIndex = other.index$
    if (index < otherIndex) return -1
    if (index > otherIndex) return 1
    return 0
  }

  clone() {
    this.__throwIfStale$()
    const { sequence$: sequence, index$: index } = this
    return new SequenceCursor(sequence, index)
  }

  toString() {
    this.__throwIfStale$()
    const { sequence$: sequence, index$: index } = this
    return `SequenceCursor(${sequence.constructor.name}, ` + 
      `${sequence.count}, ${index})`
  }  
}