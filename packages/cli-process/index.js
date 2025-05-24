import { AsyncLocalStorage } from 'async_hooks'
import { Path } from '@kingjs/path'

const ASYNC_LOCAL_STORAGE_SYMBOL = Symbol.for('@kingjs/cli-process/async-local-storage')

if (process[ASYNC_LOCAL_STORAGE_SYMBOL] == null) {
  const storage = new AsyncLocalStorage()
  process[ASYNC_LOCAL_STORAGE_SYMBOL] = storage
}

export class CliProcess {
  static create({ cwdFn, env = process.env, signal }, callback) {
    return new Promise((resolve, reject) => {
      process[ASYNC_LOCAL_STORAGE_SYMBOL].run({ env, signal }, 
        () => Promise.resolve().then(() => {
          return cwdFn ? Path.withCwd(cwdFn, callback) : callback()
        }).catch(reject).then(resolve)
      )
    })
  }

  static cwd() {
    return Path.cwd()
  }

  static get env() {
    return this.#context?.env ?? process.env
  }

  static get signal() {
    return this.#context?.signal ?? null
  }

  static get #context() {
    return process[ASYNC_LOCAL_STORAGE_SYMBOL].getStore()
  }
}
