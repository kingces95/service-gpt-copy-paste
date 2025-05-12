import { Functor } from '@kingjs/functor'

// CliFunctor is both a function and a promise; CliFunctor is a fluent interface
// which only allows repeated invocation of the same method until it is activated
// by awaiting it. After activation, the function is no longer callable. 
// 
// CliFunctor allows a chain of functors be activated in a single await statement 
// like so:
// 
//    await functor(...)(...)(...)
//
// CliFunctor is useful to emulating bash redirection syntax. For example, the 
// following bash command: 
// 
//    mycommand $myvar < input.txt 2> error.txt | grep hello | wc -l
//
// can be made equivalent to the following javascript code where $`` is a tagged 
// template which returns a CliFunctor instance:
//
//    const [ cmdResult, grepResult, wcResult ] = await $`mycommand ${myvar}`({ 
//      stdin: 'input.txt', stderr: 'error.txt' 
//    })($`grep hello`)($`wc -l`)
//

export class CliFunctor extends Functor {
  #activated = false
  #accept
  #promise

  constructor() {
    super()
    this.#promise = new Promise(accept => this.#accept = accept)
  }

  #activate() {
    if (!this.#activated) {
      this.#activated = true
      this.#promise = this.#promise
        .then(() => this.activate$())
      this.#accept()
    }
    return this.#promise
  }

  get activated() { return this.#activated }

  $() {
    if (this.#activated) throw new Error('CliFunctor already activated')
    return arguments.length == 0 
      ? this.activate$() : this.update$(...arguments)
  }

  then(...args) { return this.#activate().then(...args) }
  catch(...args) { return this.#activate().catch(...args) }
  finally(...args) { return this.#activate().finally(...args) }

  async update$() { }
  async activate$() { }
}
