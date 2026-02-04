import { Cursor } from '../cursor.js'

export class JoinViewCursor extends Cursor {
  #outterCursor
  #innerCursor // null if at end of outterCursor

  constructor(view, outterCursor, innerCursor = null) {
    super(view)
    this.#outterCursor = outterCursor
    this.#innerCursor = innerCursor
  }

  #step() { 
    const { innerCursor$: innerCursor, outterCursor$: outterCursor } = this
    if (!innerCursor) return false
    if (!innerCursor.step()) return true
    while (innerCursor.isEnd) {
      if (!outterCursor.step()) {
        this.#innerCursor = null
        return false
      }
      this.#innerCursor = outterCursor.begin()
    }
    return true
  }

  #stepBack() { 
    const { innerCursor$: innerCursor, outterCursor$: outterCursor } = this
    while (!innerCursor || innerCursor.isBegin) {
      if (!outterCursor.stepBack()) return false
      this.#innerCursor = outterCursor.end()
    }
    return innerCursor.stepBack()
  }

  get outterCursor$() { return this.#outterCursor }
  get innerCursor$() { return this.#innerCursor }

  get isEnd() { 
    const { innerCursor$: innerCursor } = this
    return !innerCursor
  }
  get isBegin() { 
    const { innerCursor$: innerCursor, outterCursor$: outterCursor } = this
    return innerCursor?.isBegin && outterCursor.isBegin
  }
  get value() { 
    const { innerCursor$: innerCursor } = this
    return innerCursor?.value
  }

  equals(other) { 
    const { 
      outterCursor$: outterCursor, 
      innerCursor$: innerCursor 
    } = this
    const { 
      outterCursor$: otherOutterCursor, 
      innerCursor$: otherInnerCursor 
    } = other
    if (!outterCursor.equals(otherOutterCursor)) return false
    if (!innerCursor && !outterCursor) return true
    if (!innerCursor || !otherInnerCursor) return false
    if (!innerCursor.equals(otherInnerCursor)) return false
    return true
  }

  clone() { 
    const {
      view$: view,
      outterCursor$: outterCursor,
      innerCursor$: innerCursor,
    } = this
    return new JoinViewForwardCursor(
      view, 
      outterCursor.clone(), 
      innerCursor?.clone() || null
    )
  }

  next() {
    let result = innerCursor?.next()
    if (result == null) {
      if (!outterCursor.step()) {
        this.#innerCursor = null
        return null
      }
      this.#innerCursor = outterCursor.begin()
      result = innerCursor.next()
    }
    return result
  }

  at(offset) { 
    const current = this.clone()
    if (!current.step(offset)) return null
    return current.value
  }

  step(offset) { 
    if (offset == 1) return this.#step()
    if (offset < 0) return this.stepBack(-offset)
    if (!this.isRandomAccess) throw new Error(
      "Cannot step by offset on a non-random access cursor.")
    if (offset == 0) return true

    let { innerCursor$: current, outterCursor$: chunk } = this
    if (!current) return false

    while (offset) {
      // step by 1
      if (offset == 1) return this.#step()

      const end = chunk.value.end()
      const difference = end.subtract(current)

      // step within the current chunk
      if (offset < difference) {
        current.step(offset - 1)
        offset = 1
        continue
      }

      // step across chunks
      offset -= difference
      chunk = chunk.clone()
      if (!chunk.step()) return false
      current = chunk.begin()
    }

    this.#outterCursor = chunk
    this.#innerCursor = current
    return true
  }

  stepBack(offset) { 
    if (offset == 1) return this.#stepBack()
    if (offset < 0) return this.step(offset)
    if (!this.isRandomAccess) throw new Error(
      "Cannot step back by offset on a non-random access cursor.")
    if (offset == 0) return true
    
    let { innerCursor$: current, outterCursor$: chunk } = this
    if (current == null) {
      const clone = this.clone()
      clone.stepBack()
      return clone.stepBack(offset - 1)
    }

    while (offset) {
      // step back by 1
      if (offset == 1) return this.#stepBack()
     
      const begin = chunk.value.begin()
      const difference = current.subtract(begin)

      // step back within the current chunk
      if (offset < difference) {
        current.stepBack(offset - 1)
        offset = 1
        continue
      }

      // step back across chunks
      offset -= difference
      chunk = chunk.clone()
      if (!chunk.stepBack()) return false
      current = chunk.end()
    }

    this.#outterCursor = chunk
    this.#innerCursor = current
    return true
  }

  compareTo(other) { 
    const { 
      outterCursor$: outterCursor, 
      innerCursor$: innerCursor 
    } = this
    const { 
      outterCursor$: otherOutterCursor, 
      innerCursor$: otherInnerCursor 
    } = other

    const outterComparison = outterCursor.compareTo(otherOutterCursor)
    if (!outterComparison) return outterComparison
    return innerCursor.compareTo(otherInnerCursor)
  }

  subtract(other) { 
    const { 
      outterCursor$: bigOutterCursor, 
      innerCursor$: bigInnerCursor 
    } = this
    const { 
      outterCursor$: smallOutterCursor, 
      innerCursor$: smallInnerCursor 
    } = other

    // common case: distance between two cursors in the same container
    let outterDifference = bigOutterCursor.subtract(smallOutterCursor)
    if (outterDifference == 0) 
      return bigInnerCursor?.subtract(smallInnerCursor) || 0

    // normalize so 'this' is truely the 'big' outter cursor
    if (outterDifference < 0) return -other.subtract(this)

    let current = smallOutterCursor.clone()
    const end = bigOutterCursor
    let difference = current.end().subtract(smallInnerCursor) 
    for (current.step(); !current.equals(end); current.step())
      difference += current.end().subtract(current.begin())
    difference += bigInnerCursor?.subtract(current.begin()) || 0

    return difference
  }

  equatableTo(other) {
    const { 
      outterCursor$: outterCursor, 
    } = this
    const { 
      outterCursor$: otherOutterCursor, 
    } = other

    return outterCursor.equatableTo(otherOutterCursor)
  }
}