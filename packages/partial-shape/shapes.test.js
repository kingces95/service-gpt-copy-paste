import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Shape } from './shape.js'
import { extend } from '@kingjs/partial-extend'
import { 
  PojoShape,
  NojoShape,
  ThenableShape,
  IterableShape,
  AsyncIterableShape,
  IteratorShape,
  ErrorShape,
  PromiseShape,
  DisposableShape,
  AsyncDisposableShape,
  AbortSignalShape,
  EventEmitterShape,
  EventTargetShape,
  DateShape,
  RegExpShape,

  AsyncFunctionShape,
  GeneratorFunctionShape,
  AsyncGeneratorFunctionShape,
  CallableShape,
  ClassConstructorShape,
  ConstructorShape,
  FunctionConstructorShape,
} from './shapes.js'

// general shapes
const PojoShapeTest = {
  shape: PojoShape,
  positive: [
    { name: 'object literal', value: { } },
    { name: 'object literal with properties', value: { a: 1, b: 2 } },
  ],
  negative: [
    { name: 'array', value: [] },
    { name: 'object extends null', value: Object.create(null) },
  ]
}
const NojoShapeTest = {
  shape: NojoShape,
  positive: [
    { name: 'object extends null', value: Object.create(null) },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'object literal with properties', value: { a: 1, b: 2 } },
    { name: 'array', value: [] },
  ]
}
const IterableShapeTest = {
  shape: IterableShape,
  positive: [
    { name: 'array', value: [] },
    { name: 'string', value: '' },
    { name: 'Set', value: new Set() },
    { name: 'custom', value: { [Symbol.iterator]() { } } },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'object extends null', value: Object.create(null) },
  ]
}
const IteratorShapeTest = {
  shape: IteratorShape,
  positive: [
    { name: 'custom', value: { next() { } } },
    { name: 'array iterator', value: [][Symbol.iterator]() },
  ],
  negative: [
    { name: 'object without next method', value: { } },
    { name: 'array', value: [] },
  ]
}
const ErrorShapeTest = {
  shape: ErrorShape,
  positive: [
    { name: 'Error', value: new Error() },
    { name: 'custom', value: { name: 'MyError', message: 'An error occurred' } },
  ],
  negative: [
    { name: 'object without name and message properties', value: { } },
    { name: 'array', value: [] },
  ]
}
const DisposableShapeTest = {
  shape: DisposableShape,
  positive: [
    { name: 'custom with dispose method', value: { [Symbol.dispose]() { } } },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}

// Node / platform-oriented shapes
const AbortSignalShapeTest = {
  shape: AbortSignalShape,
  positive: [
    { name: 'AbortSignal', value: new AbortController().signal },
    { name: 'custom', 
      value: { 
        get aborted() { return false },
        addEventListener() { }
      } 
    },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const EventEmitterShapeTest = {
  shape: EventEmitterShape,
  positive: [
    { name: 'EventEmitter', value: new (require('events').EventEmitter)() },
    { name: 'custom', 
      value: { 
        on() { },
        emit() { }
      } 
    },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const EventTargetShapeTest = {
  shape: EventTargetShape,
  positive: [
    { name: 'EventTarget', value: new EventTarget() },
    { name: 'custom', 
      value: { 
        addEventListener() { },
        removeEventListener() { },
        dispatchEvent() { }
      } 
    },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}

// other useful shapes
const DateShapeTest = {
  shape: DateShape,
  positive: [
    { name: 'Date instance', value: new Date() },
    { name: 'custom', value: { getTime() { return 0 } } },
  ],
  negative: [
    { name: 'array literal', value: [] },
    { name: 'object literal', value: { } },
    { name: 'object extends null', value: Object.create(null) },
  ]
}
const RegExpShapeTest = {
  shape: RegExpShape,
  positive: [
    { name: 'RegExp instance', value: /./ },
    { name: 'custom', value: { test() { return true }, exec() { return null } } },
  ],
  negative: [
    { name: 'array literal', value: [] },
    { name: 'object literal', value: { } },
    { name: 'object extends null', value: Object.create(null) },
  ]
}

// function and class shapes
const GeneratorFunctionShapeTest = {
  shape: GeneratorFunctionShape,
  positive: [
    { name: 'generator function declaration', value: function*() { } },
  ],
  negative: [
    { name: 'async generator function declaration', value: async function*() { } },
    { name: 'function declaration', value: function() { } },
    { name: 'function expression', value: () => { } },
    { name: 'class constructor', value: class { } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const CallableShapeTest = {
  shape: CallableShape,
  positive: [
    { name: 'function declaration', value: function() { } },
    { name: 'function expression', value: () => { } },
    { name: 'class constructor', value: class { } },
    { name: 'member function', value: { method() { } }.method },
    { name: 'class member function', 
      value: class { method() { } }.prototype.method },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const ConstructorShapeTest = {
  shape: ConstructorShape,
  positive: [
    { name: 'class constructor', value: class { } },
    { name: 'function declaration', value: function() { } },
  ],
  negative: [
    { name: 'member function', value: { method() { } }.method },
    { name: 'class member function', 
      value: class { method() { } }.prototype.method },
    { name: 'function expression', value: () => { } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const ClassConstructorShapeTest = {
  shape: ClassConstructorShape,
  positive: [
    { name: 'class constructor', value: class { } },
  ],
  negative: [
    { name: 'member function', value: { method() { } }.method },
    { name: 'class member function', 
      value: class { method() { } }.prototype.method },
    { name: 'function declaration', value: function() { } },
    { name: 'function expression', value: () => { } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const FunctionConstructorShapeTest = {
  shape: FunctionConstructorShape,
  positive: [
    { name: 'function declaration', value: function() { } },
  ],
  negative: [
    { name: 'class constructor', value: class { } },
    { name: 'member function', value: { method() { } }.method },
    { name: 'class member function', 
      value: class { method() { } }.prototype.method },
    { name: 'function expression', value: () => { } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}

// async shapes
const PromiseShapeTest = {
  shape: PromiseShape,
  positive: [
    { name: 'Promise', value: Promise.resolve() },
    { name: 'custom thenable with catch and finally', 
      value: { then() { }, catch() { }, finally() { } } },
  ],
  negative: [
    { name: 'custom thenable without catch and finally', 
      value: { then() { } } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const ThenableShapeTest = {
  shape: ThenableShape,
  positive: [
    { name: 'object with then method', value: { then() { } } },
    { name: 'Promise', value: Promise.resolve() },
  ],
  negative: [
    { name: 'object without then method', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncIterableShapeTest = {
  shape: AsyncIterableShape,
  positive: [
    { name: 'custom', value: { [Symbol.asyncIterator]() { } } },
    { name: 'async generator', value: (async function*() { })() },
    { name: 'ReadableStream', value: new ReadableStream() },
  ],
  negative: [
    { name: 'object without async iterator method', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncDisposableShapeTest = {
  shape: AsyncDisposableShape,
  positive: [
    { name: 'custom with async dispose method', 
      value: { [Symbol.asyncDispose]() { } } },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncFunctionShapeTest = {
  shape: AsyncFunctionShape,
  positive: [
    { name: 'async function declaration', value: async function() { } },
    { name: 'async function expression', value: async () => { } },
  ],
  negative: [
    { name: 'function declaration', value: function() { } },
    { name: 'function expression', value: () => { } },
    { name: 'class constructor', value: class { } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncGeneratorFunctionShapeTest = {
  shape: AsyncGeneratorFunctionShape,
  positive: [
    { name: 'async generator function declaration', value: async function*() { } },
  ],
  negative: [
    { name: 'generator function declaration', value: function*() { } },
    { name: 'function declaration', value: function() { } },
    { name: 'function expression', value: () => { } },
    { name: 'class constructor', value: class { } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}

const Tests = [
  PojoShapeTest,
  NojoShapeTest,
  IterableShapeTest,
  IteratorShapeTest,
  ErrorShapeTest,
  DisposableShapeTest,
  AbortSignalShapeTest,
  EventEmitterShapeTest,
  EventTargetShapeTest,
  DateShapeTest,
  RegExpShapeTest,
  
  GeneratorFunctionShapeTest,
  CallableShapeTest,
  ClassConstructorShapeTest,
  ConstructorShapeTest,
  FunctionConstructorShapeTest,
  
  PromiseShapeTest,
  ThenableShapeTest,
  AsyncIterableShapeTest,
  AsyncDisposableShapeTest,
  AsyncFunctionShapeTest,
  AsyncGeneratorFunctionShapeTest,
]

describe.each(Tests)("$shape.name", ({ shape, positive, negative }) => {
  for (const { name, value } of positive) {
    it(`is ${name}`, () => {
      expect(value).toBeInstanceOf(shape)
    })  
  }
  for (const { name, value } of negative) {
    it(`is not ${name}`, () => {
      expect(value).not.toBeInstanceOf(shape)
    })  
  }
})

describe('Shapes', () => {
  it('should throw if defined on a non-function', () => {
    const myShape = class extends Shape { }
    expect(() => extend(class { }, myShape))
      .toThrow('Assertion failed: Shapes cannot be extended.')
  })
  it('should be false if null or undefined', () => {
    expect(null).not.toBeInstanceOf(PojoShape)
    expect(undefined).not.toBeInstanceOf(PojoShape)
  })
  it('should be false for Shape itself', () => {
    expect({ }).not.toBeInstanceOf(Shape)
  })
  describe('with odd an ctor prototype', () => {
    let proto
    let fn
    beforeEach(() => {
      fn = () => { }
      Object.defineProperty(fn, 'prototype', { 
        value: { constructor: fn }, 
        enumerable: false, 
        configurable: true,
        writable: true,
      })
      proto = fn.prototype
    })

    it('should be false if configurable is true', () => {
      expect(fn).not.toBeInstanceOf(ConstructorShape)
    })
    it('should be false if enumerable is true', () => {
      Object.defineProperty(fn, 'prototype', { enumerable: true })
      Object.defineProperty(fn, 'prototype', { configurable: false })
      expect(fn).not.toBeInstanceOf(ConstructorShape)
    })
    describe('that is not configurable', () => {
      beforeEach(() => {
        Object.defineProperty(fn, 'prototype', { configurable: false })
      })
      it('should be false if no value descriptor', () => {
        Object.defineProperty(fn, 'prototype', { value: undefined })
        expect(fn).not.toBeInstanceOf(ConstructorShape)
      })
      it('should be false if prototype is not an object', () => {
        fn.prototype = 42
        expect(fn).not.toBeInstanceOf(ConstructorShape)
      })
      it('should be false if prototype is null', () => {
        fn.prototype = null
        expect(fn).not.toBeInstanceOf(ConstructorShape)
      })
      it('should be false if prototype.constructor is not the function', () => {
        fn.prototype = { constructor: function() { } }
        expect(fn).not.toBeInstanceOf(ConstructorShape)
      })
    })  
  })
})