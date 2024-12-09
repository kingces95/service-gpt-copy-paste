import { Subject, of, timer } from 'rxjs'
import { concatMap, throttleTime, retry as retryOperation } from 'rxjs/operators'
import collateBy from '@kingjs/rx-collate-by'

export default class AwaitProxy {
  static END_METHOD = Symbol('endMethod')

  constructor(target, declarations = {}) {
    this.target = target
    this.subject = new Subject()

    const { throttle = {}, retry = {}, end = [] } = declarations
    const endMethods = new Set(end)

    const source = this.subject.pipe(
      collateBy((task) => (task.throttleConfig ? 'throttle' : 'normal')),
      concatMap((group) =>
        group.key === 'throttle'
          ? group.pipe(
              throttleTime(
                group[0].throttleConfig.ms,
                null,
                { trailing: true }
              )
            )
          : group
      ),
      concatMap((task) =>
        of(task).pipe(
          concatMap((task) => task.execute()),
          retryOperation({
            count: task.retryConfig ? task.retryConfig.attempts - 1 : 0,
            delay: (error, attempt) => 
              timer(task.retryConfig.ms * (attempt + 1)**2)
          })
        )
      )
    )

    this.proxyPromise = new Promise((resolveProxy, rejectProxy) => {
      source.subscribe({
        next: ({ isEndMethod }) => {
          if (isEndMethod) {
            this.subject.complete()
          }
        },
        error: (err) => {
          rejectProxy(err)
        },
        complete: () => {
          resolveProxy()
        }
      })
    })

    return new Proxy(this, {
      get: (proxy, property) => {
        if (property in this.proxyPromise) {
          return this.proxyPromise[property].bind(this.proxyPromise)
        }

        if (property === AwaitProxy.END_METHOD) {
          return () => {
            this.subject.next({
              execute: async () => ({ isEndMethod: true })
            })
          }
        }

        if (typeof this.target[property] === 'function') {
          return (...args) => {
            const throttleConfig = throttle[property]
            const retryConfig = retry[property]
            const isEndMethod = endMethods.has(property)

            let result
            this.subject.next({
              execute: async () => {
                result = await this.target[property](...args)
                return { isEndMethod }
              },
              throttleConfig,
              retryConfig
            })
            return result
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
