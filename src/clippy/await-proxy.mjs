import { Subject } from 'rxjs'
import { concatMap, throttleTime } from 'rxjs/operators'
import collateBy from '@kingjs/rx-collate-by'

export default class AwaitProxy extends Promise {
  constructor(target, declarations = {}) {
    let resolveComplete
    let resolveReject

    super((resolve, reject) => {
      resolveComplete = resolve
      resolveReject = reject
    })

    this.target = target
    this.subject = new Subject()
    this.resolveComplete = resolveComplete

    const { throttleMs = 200, throttle = [], end = [] } = declarations
    const throttledMethods = new Set(throttle)
    const endMethods = new Set(end)

    // Define pipeline for task processing
    const source = this.subject.pipe(
      collateBy((task) => (task.isThrottled ? 'throttle' : 'normal')),
      concatMap((grouped) =>
        grouped.key === 'throttle'
          ? grouped.pipe(
              throttleTime(throttleMs, null, { trailing: true }),
              concatMap((task) => task.execute())
            )
          : grouped.pipe(concatMap((task) => task.execute()))
      )
    )

    source.subscribe({
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
            const methodName = property
            const isThrottled = throttledMethods.has(methodName)
            const isEndMethod = endMethods.has(methodName)

            return new Promise((resolve, reject) => {
              this.subject.next({
                execute: async () => {
                  try {
                    const result = await this.target[property](...args)
                    resolve(result)

                    if (isEndMethod) {
                      this.subject.complete()
                    }
                  } catch (err) {
                    reject(err)
                    this.subject.error(err)
                  }
                },
                isThrottled
              })
            })
          }
        }

        return this.target[property]
      }
    })
  }

  static resolveAwaitProxy(target, declarations = {}) {
    return new AwaitProxy(target, declarations)
  }
}
