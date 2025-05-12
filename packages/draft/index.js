import { pojoFreeze } from '@kingjs/pojo-freeze'

export class Draft {
  #self
  #reviseFn
  #publishFn
  #published = false
  #publishing = false
  #result

  constructor({ revise, publish, self }) {
    this.#reviseFn = revise
    this.#publishFn = publish
    this.#self = self ?? this
  }

  revise(...args) {
    if (this.#published)
      throw new Error('Cannot revise after publish')
    this.#reviseFn.call(this.#self, ...args)
    return this
  }

  publish() {
    if (this.#published) return this.#result
    
    if (this.#publishing) 
      throw new Error('Publishing already in progress')
    
    this.#publishing = true
    this.#result = this.#publishFn.call(this.#self)
    this.#publishing = false
    this.#published = true
    
    pojoFreeze(this)
    return this.#result
  }
}

export class Draftor {
  constructor(options) {
    let draft = null
    const self = function(...args) {
      if (!args.length)
        return draft.publish()
      draft.revise(...args)
      return self
    }
    draft = new Draft({ ...options, self })
    Object.setPrototypeOf(self, new.target.prototype)
    return self
  }
}

export class DraftorPromise extends Draftor {
  constructor(options) {
    super(options)
  }

  then(...args) {
    return this().then(...args)
  }

  catch(...args) {
    return this().catch(...args)
  }

  finally(...args) {
    return this().finally(...args)
  }
} 
