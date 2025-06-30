import { Iterator } from '../iterator.js'

// ActionIterator preforms an action when set is called and enforces that step
// is called between each set call. This is useful for iterators that need to
// perform an action on each set, such as BackInsertCursor. ActionIterator
// cannot be made read-only, as it requires the set method to be called to
// perform the action. It is not equatable, as it does not represent a value
// but rather an action to be performed.
export class OutputIteratorAdaptor extends Iterator {
  #action
  #actionTaken

  constructor(action) {
    super()
    this.#action = action
    this.#actionTaken = false
  }

  set isReadOnly(value) {
    throw new Error(
      "OutputIteratorAdaptor cannot be made read-only.")
  }

  set(value) {
    if (this.#actionTaken) throw new Error(
      "Action already taken, step must be called before set.")
    this.#action(value)
    this.#actionTaken = true
  }

  step() {
    if (!this.#actionTaken) throw new Error(
      "Action not taken, set must be called before step.")
    this.#actionTaken = false
  }

  equatable(other) { return false }
}
