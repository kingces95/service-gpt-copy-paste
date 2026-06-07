import { thunk } from '@kingjs/function-contract'
import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  RangeConcept,
} from '@kingjs/cursor'
import {
  ClearableContainerPart,
  FrontInsertableContainerPart,
  BackInsertableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  EditableContainerPart,
  BulkAssignableContainerPart,
  BulkEditableContainerPart,
  sourceRange,
} from '../container-parts.js'
import {
  IndexableCursor
} from '../cursor/indexable-cursor.js'
import { iterate, next } from '@kingjs/cursor-algorithm'

const BlockCapacity = 32

export class Deque extends PartialProxy {
    static cursorType = IndexableCursor
    static defaultValue = undefined

    _blocks
    _start
    _size

    constructor() {
      super()
      this._blocks = new Map()
      this._start = 0
      this._size = 0
    }

    _offsetOf(index) {
      return this._start + index
    }

    _blockIndexOf(offset) {
      return Math.floor(offset / BlockCapacity)
    }

    _slotIndexOf(offset) {
      return ((offset % BlockCapacity) + BlockCapacity) % BlockCapacity
    }

    _blockAtOffset(offset, create = false) {
      const blockIndex = this._blockIndexOf(offset)
      let block = this._blocks.get(blockIndex)

      if (!block && create) {
        block = new Array(BlockCapacity)
        this._blocks.set(blockIndex, block)
      }

      return block
    }

    _getAtOffset(offset) {
      const block = this._blockAtOffset(offset)
      return block[this._slotIndexOf(offset)]
    }

    _setAtOffset(offset, value) {
      const block = this._blockAtOffset(offset, true)
      block[this._slotIndexOf(offset)] = value
    }

    _deleteUnusedBlocks() {
      if (this._size == 0) {
        this._blocks = new Map()
        this._start = 0
        return
      }

      const first = this._blockIndexOf(this._start)
      const last = this._blockIndexOf(this._start + this._size - 1)

      for (const blockIndex of this._blocks.keys())
        if (blockIndex < first || blockIndex > last)
          this._blocks.delete(blockIndex)
    }

    static {
      implement(this, RangeConcept, {
        begin() { return new this.cursorType(this, 0) },
        end() { return new this.cursorType(this, this.size) },
      })
    }

    static {
      compose(this, SizedContainerPart, {
        get size() { return this._size },
      })

      compose(this, IndexableContainerPart, {
        at(index) { return this._getAtOffset(this._offsetOf(index)) },
        setAt(index, value) { this._setAtOffset(this._offsetOf(index), value) },
      })

      compose(this, ClearableContainerPart, {
        clear() {
          this._blocks = new Map()
          this._start = 0
          this._size = 0
        },
      })

      compose(this, BulkAssignableContainerPart, {
        get defaultValue$() { return this.constructor.defaultValue },

        resize(count, value = this.constructor.defaultValue) {
          if (count < this.size) {
            this._size = count
            this._deleteUnusedBlocks()
            return this
          }

          while (this.size < count)
            this.pushBack(value)

          return this
        },

        assignRange: thunk({
          transforms: [sourceRange],
          method(range) {
            this.clear()
            return this.insertRange(this.begin(), range)
          },
        }),
      })

      compose(this, FrontInsertableContainerPart, {
        popFront() {
          const value = this.at(0)
          this._start++
          this._size--
          this._deleteUnusedBlocks()
          return value
        },

        pushFront(value) {
          this._start--
          this._size++
          this.setAt(0, value)
        },
      })

      compose(this, BackInsertableContainerPart, {
        pushBack(value) {
          this._setAtOffset(this._start + this._size, value)
          this._size++
        },

        popBack() {
          const value = this.at(this.size - 1)
          this._size--
          this._deleteUnusedBlocks()
          return value
        },
      })

      compose(this, EditableContainerPart, {
        erase(first, last = next(first)) {
          const index = first.index
          const count = last.index - first.index

          for (let i = index; i < this.size - count; i++)
            this.setAt(i, this.at(i + count))

          this._size -= count
          this._deleteUnusedBlocks()
          return first.clone()
        },
      }, {
        insertValue(cursor, value) { },
      })

      compose(this, BulkEditableContainerPart, {
        insertRange: thunk({
          transforms: [null, sourceRange],
          method(cursor, range) {
            const values = [...iterate(range)]
            const index = cursor.index
            const count = values.length

            if (count == 0)
              return this

            const oldSize = this.size
            this._size += count

            for (let i = oldSize - 1; i >= index; i--)
              this.setAt(i + count, this.at(i))

            for (let i = 0; i < count; i++)
              this.setAt(index + i, values[i])

            return this
          },
        }),
      })
  }
}
