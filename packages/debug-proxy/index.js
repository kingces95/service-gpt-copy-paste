import { createProxy } from '@kingjs/proxy'
// import { Reflection } from '@kingjs/reflection'
// import { getOwn } from '@kingjs/get-own'

// DebugProxy is a class that clients can extend which will build a
// prototype chain of preconditions exposed as static getters and
// then use that prototype chain to create a proxy for the instance
// which will execute before corresponding property access (see 
// createProxy). The intention is for clients to move "debug" checks
// from the instance methods to the proxy preconditions for clarity
// and also for performance since the preconditions can be disabled
// once the code is stable and deployed. 
export const Preconditions = Symbol('Preconditions')

export class DebugProxy {
  static [Preconditions] = class { }

  constructor() {
    const { prototype: preconditions } = this.constructor[Preconditions]
    return createProxy(this, { preconditions })
  }
}
