import { Shape } from './shape.js'

// ____________________________________________________________________________
// Most compelling — core JS semantics

export class PojoShape extends Shape {
  static typeof = 'object'
  static proto = Object.prototype
}

export class NojoShape extends Shape {
  static typeof = 'object'
  static proto = null
}

export class IterableShape extends Shape {
  [Symbol.iterator]() { }
}

export class IteratorShape extends Shape {
  next() { }
}

export class ErrorShape extends Shape {
  get name() { }
  get message() { }
}

export class DisposableShape extends Shape {
  [Symbol.dispose]() { }
}

// ____________________________________________________________________________
// Node / platform-oriented

export class AbortSignalShape extends Shape {
  get aborted() { }
  addEventListener() { }
}

export class EventEmitterShape extends Shape {
  on() { }
  emit() { }
}

export class EventTargetShape extends Shape {
  addEventListener() { }
  removeEventListener() { }
  dispatchEvent() { }
}

// ____________________________________________________________________________
// Other useful shapes

export class DateShape extends Shape {
  getTime() { }
}

export class RegExpShape extends Shape {
  test() { }
  exec() { }
}

// ____________________________________________________________________________
// Function shapes

export class CallableShape extends Shape {
  static typeof = 'function'
}

export class GeneratorFunctionShape extends Shape {
  static typeof = 'function'
  static tag = 'GeneratorFunction'
}

export class FunctionConstructorShape extends Shape {
  static typeof = 'function'
  static protoPrototype = {
    enumerable: false,
    configurable: false,
    writable: true,
  }
}

export class ClassConstructorShape extends Shape {
  static typeof = 'function'
  static protoPrototype = {
    enumerable: false,
    configurable: false,
    writable: false,
  }
}

export class ConstructorShape extends Shape {
  static typeof = 'function'
  static protoPrototype = {
    enumerable: false,
    configurable: false,
  }
}

// ____________________________________________________________________________
// Async shapes

export class PromiseShape extends Shape {
  then() { }
  catch() { }
  finally() { }
}

export class ThenableShape extends Shape {
  then() { }
}

export class AsyncIterableShape extends Shape {
  [Symbol.asyncIterator]() { }
}

export class AsyncDisposableShape extends Shape {
  [Symbol.asyncDispose]() { }
}

export class AsyncFunctionShape extends Shape {
  static typeof = 'function'
  static tag = 'AsyncFunction'
}

export class AsyncGeneratorFunctionShape extends Shape {
  static typeof = 'function'
  static tag = 'AsyncGeneratorFunction'
}
