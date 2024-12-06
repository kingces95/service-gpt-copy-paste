import { Subject } from 'rxjs'
import { concatMap } from 'rxjs/operators'

export default class AwaitProxy extends Promise {
  constructor(target, options = {}) {
    let resolveComplete
    let resolveReject
    super((resolve, reject) => {
      resolveComplete = resolve,
      resolveReject = reject
    })

    this.target = target
    this.subject = new Subject()
    this.resolveComplete = resolveComplete

    const {
      pipeline = null,
      executor = (resolve, reject) => { }
    } = options

    executor(
      () => this.subject.complete(),
      (err) => this.subject.error(err)
    )

    const source = this.subject.pipe(concatMap(task => task()))
    const finalPipeline = pipeline ? pipeline(source) : source

    finalPipeline.subscribe({
      error: (err) => {
        resolveReject(err) // Reject the promise on error
      },
      complete: () => {
        resolveComplete() // Resolve the promise when complete
      }
    })

    return new Proxy(this, {
      get: (proxy, property) => {
        if (typeof this.target[property] === 'function') {
          return (...args) => {
            this.subject.next(async () => {
              await this.target[property](...args)
            })
          }
        }
        return this.target[property]
      }
    })
  }

  static resolveAwaitProxy(target, options = {}) {
    return new AwaitProxy(target, options)
  }
}
