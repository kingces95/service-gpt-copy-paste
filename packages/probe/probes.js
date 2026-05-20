import { Probe } from './probe.js'

// ____________________________________________________________________________
// Most compelling — core JS semantics

export class PojoProbe extends Probe {
  static typeof = 'object'
  static proto = Object.prototype
}

export class NojoProbe extends Probe {
  static typeof = 'object'
  static proto = null
}

export class IterableProbe extends Probe {
  [Symbol.iterator]() { }
}

export class IteratorProbe extends Probe {
  next() { }
}

export class ErrorProbe extends Probe {
  get name() { }
  get message() { }
}

export class DisposableProbe extends Probe {
  [Symbol.dispose]() { }
}

// ____________________________________________________________________________
// Node / platform-oriented

export class AbortSignalProbe extends Probe {
  get aborted() { }
  addEventListener() { }
}

export class EventEmitterProbe extends Probe {
  on() { }
  emit() { }
}

export class EventTargetProbe extends Probe {
  addEventListener() { }
  removeEventListener() { }
  dispatchEvent() { }
}

// ____________________________________________________________________________
// Other useful probes

export class DateProbe extends Probe {
  getTime() { }
}

export class RegExpProbe extends Probe {
  test() { }
  exec() { }
}

// ____________________________________________________________________________
// Function probes

export class CallableProbe extends Probe {
  static typeof = 'function'
}

export class GeneratorFunctionProbe extends Probe {
  static typeof = 'function'
  static tag = 'GeneratorFunction'
}

export class FunctionConstructorProbe extends Probe {
  static typeof = 'function'
  static protoPrototype = {
    enumerable: false,
    configurable: false,
    writable: true,
  }
}

export class ClassConstructorProbe extends Probe {
  static typeof = 'function'
  static protoPrototype = {
    enumerable: false,
    configurable: false,
    writable: false,
  }
}

export class ConstructorProbe extends Probe {
  static typeof = 'function'
  static protoPrototype = {
    enumerable: false,
    configurable: false,
  }
}

// ____________________________________________________________________________
// Async probes

export class PromiseProbe extends Probe {
  then() { }
  catch() { }
  finally() { }
}

export class ThenableProbe extends Probe {
  then() { }
}

export class AsyncIterableProbe extends Probe {
  [Symbol.asyncIterator]() { }
}

export class AsyncDisposableProbe extends Probe {
  [Symbol.asyncDispose]() { }
}

export class AsyncFunctionProbe extends Probe {
  static typeof = 'function'
  static tag = 'AsyncFunction'
}

export class AsyncGeneratorFunctionProbe extends Probe {
  static typeof = 'function'
  static tag = 'AsyncGeneratorFunction'
}
