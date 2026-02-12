import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-proxy'
import { CursorFactoryConcept } from '@kingjs/cursor'
import { extend } from '@kingjs/partial-extend'
import { SequenceContainer } from '../helpers/sequence-container.js'
import { RewindContainer } from "../helpers/rewind-container.js"
import { ChainNode } from "./chain-node.js"
import { 
  PrologContainerConcept,
  EpilogContainerConcept,
  SequenceContainerConcept,
  RewindContainerConcept,
} from "../container-concepts.js"

export class Chain extends RewindContainer {
  _count
  _root
  _end

  constructor() { 
    super()
    this._root = new ChainNode()
    this._end = this._root.insertAfter() 
    this._count = 0
    this.__check()
  }

  __check() {
    // the chain should form a loop of count + 2 nodes (root and end)
    // let count = this.#count + 2

    // let current = this.#root
    // for (let i = 0; i < count; i++)
    //   current = current.next
    // if (current != this.#root) throw new Error(
    //   'Chain is not properly linked')

    // current = this.#root
    // for (let i = 0; i < count; i++)
    //   current = current.previous
    // if (current != this.#root) throw new Error(
    //   'Chain is not properly linked in reverse')
  }

  __isActive$(link) { return !!link.next }
  __isEnd$(link) { return link == this._end }
  __isBeforeBegin$(link) { return link == this._root }

  dispose$() { 
    this._root = null 
    this._end = null
  }

  static {
    implement(this, SequenceContainer.cursorType.api$.linked$, {
      equals$({ token$: link}, { token$: otherLink }) { 
        return link == otherLink },
      step$({ token$: link }) { return link.next },
      value$({ token$: link }) { return link.value },
      setValue$({ token$: link }, value) { link.value = value },
    })

    implement(this, RewindContainer.cursorType.api$.linked$, {
      stepBack$({ token$: link }) { return link.previous }
    })
  }

  static {
    extend(this, {
      beginToken$() { return this._root.next },
      endToken$() { return this._end },
    })

    implement(this, CursorFactoryConcept, {
      get isEmpty() { return this._end == this._root.next },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this._root.next.value },
      unshift(value) { this.insertAfter(this.beforeBegin(), value) },
      shift() { return this.removeAfter(this.beforeBegin()) },
    })

    implement(this, PrologContainerConcept, {
      beforeBegin() { return new this.cursorType(this, this._root) },
      insertAfter(cursor, value) {
        cursor.token$.insertAfter(value)
        this._count++
        this.__check()
      },
      removeAfter(cursor) {
        const result = cursor.token$.removeAfter()
        this._count--
        this.__check()
        return result
      },
    })

    implement(this, RewindContainerConcept, {
      get count() { return this._count },
      get back() { return this._root.previous.previous.value },
      push(value) { this.insert(this.end(), value) },
      pop() { 
        const cursor = this.end()
        cursor.stepBack()
        return this.remove(cursor) 
      },
    })

    implement(this, EpilogContainerConcept, {
      insert(cursor, value) {
        cursor.token$.insert(value)
        this._count++
        this.__check()
      },
      remove(cursor) {
        const result = cursor.token$.remove()
        this._count--
        this.__check()
        return result
      },
    })
  }
}
