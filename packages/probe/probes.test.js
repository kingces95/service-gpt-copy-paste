import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Probe } from './probe.js'
import { 
  PojoProbe,
  NojoProbe,
  ThenableProbe,
  IterableProbe,
  AsyncIterableProbe,
  IteratorProbe,
  ErrorProbe,
  PromiseProbe,
  DisposableProbe,
  AsyncDisposableProbe,
  AbortSignalProbe,
  EventEmitterProbe,
  EventTargetProbe,
  DateProbe,
  RegExpProbe,

  AsyncFunctionProbe,
  GeneratorFunctionProbe,
  AsyncGeneratorFunctionProbe,
  CallableProbe,
  ClassConstructorProbe,
  ConstructorProbe,
  FunctionConstructorProbe,
} from './probes.js'

// general probes
const PojoProbeTest = {
  probe: PojoProbe,
  positive: [
    { name: 'object literal', value: { } },
    { name: 'object literal with properties', value: { a: 1, b: 2 } },
  ],
  negative: [
    { name: 'array', value: [] },
    { name: 'object extends null', value: Object.create(null) },
  ]
}
const NojoProbeTest = {
  probe: NojoProbe,
  positive: [
    { name: 'object extends null', value: Object.create(null) },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'object literal with properties', value: { a: 1, b: 2 } },
    { name: 'array', value: [] },
  ]
}
const IterableProbeTest = {
  probe: IterableProbe,
  positive: [
    { name: 'array', value: [] },
    { name: 'string', value: '' },
    { name: 'Set', value: new Set() },
    { name: 'custom', value: new (class Foo { [Symbol.iterator]() { } })() },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'object extends null', value: Object.create(null) },
  ]
}
const IteratorProbeTest = {
  probe: IteratorProbe,
  positive: [
    { name: 'custom', value: new (class { next() { } })() },
    { name: 'array iterator', value: [][Symbol.iterator]() },
  ],
  negative: [
    { name: 'object without next method', value: { } },
    { name: 'array', value: [] },
  ]
}
const ErrorProbeTest = {
  probe: ErrorProbe,
  positive: [
    { name: 'Error', value: new Error() },
    { name: 'custom getters', 
      value: new (class { get name() { }; get message() { }})() },
  ],
  negative: [
    { name: 'object without name and message properties', value: { } },
    { name: 'array', value: [] },
  ]
}
const DisposableProbeTest = {
  probe: DisposableProbe,
  positive: [
    { name: 'custom with dispose method', 
      value: new (class { [Symbol.dispose]() { } })() },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}

// Node / platform-oriented probes
const AbortSignalProbeTest = {
  probe: AbortSignalProbe,
  positive: [
    { name: 'AbortSignal', 
      value: new AbortController().signal },
    { name: 'custom', 
      value: new (class { 
        get aborted() { return false }
        addEventListener() { }
      })() 
    },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const EventEmitterProbeTest = {
  probe: EventEmitterProbe,
  positive: [
    { name: 'EventEmitter', 
      value: new (require('events').EventEmitter)() },
    { name: 'custom', 
      value: new (class{ 
        on() { }
        emit() { }
      })()
    },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const EventTargetProbeTest = {
  probe: EventTargetProbe,
  positive: [
    { name: 'EventTarget', value: new EventTarget() },
    { name: 'custom', 
      value: new (class { 
        addEventListener() { }
        removeEventListener() { }
        dispatchEvent() { }
      })()
    },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}

// other useful probes
const DateProbeTest = {
  probe: DateProbe,
  positive: [
    { name: 'Date instance', value: new Date() },
    { name: 'custom', value: new (class { getTime() { return 0 } })() },
  ],
  negative: [
    { name: 'array literal', value: [] },
    { name: 'object literal', value: { } },
    { name: 'object extends null', value: Object.create(null) },
  ]
}
const RegExpProbeTest = {
  probe: RegExpProbe,
  positive: [
    { name: 'RegExp instance', value: /./ },
    { name: 'custom', 
      value: new (class { 
        test() { return true }
        exec() { return null } 
      })() },
  ],
  negative: [
    { name: 'array literal', value: [] },
    { name: 'object literal', value: { } },
    { name: 'object extends null', value: Object.create(null) },
  ]
}

// function and class probes
const GeneratorFunctionProbeTest = {
  probe: GeneratorFunctionProbe,
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
const CallableProbeTest = {
  probe: CallableProbe,
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
const ConstructorProbeTest = {
  probe: ConstructorProbe,
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
const ClassConstructorProbeTest = {
  probe: ClassConstructorProbe,
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
const FunctionConstructorProbeTest = {
  probe: FunctionConstructorProbe,
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

// async probes
const PromiseProbeTest = {
  probe: PromiseProbe,
  positive: [
    { name: 'Promise', value: Promise.resolve() },
    { name: 'custom thenable with catch and finally', 
      value: new (class { 
        then() { }
        catch() { }
        finally() { } 
      })() },
  ],
  negative: [
    { name: 'custom thenable without catch and finally', 
      value: { then() { } } },
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const ThenableProbeTest = {
  probe: ThenableProbe,
  positive: [
    { name: 'Promise', value: Promise.resolve() },
    { name: 'custom', 
      value: new (class { then() { } })() },
  ],
  negative: [
    { name: 'object without then method', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncIterableProbeTest = {
  probe: AsyncIterableProbe,
  positive: [
    { name: 'async generator', value: (async function*() { })() },
    { name: 'ReadableStream', value: new ReadableStream() },
    { name: 'custom', 
      value: new (class { [Symbol.asyncIterator]() { } })() },
  ],
  negative: [
    { name: 'object without async iterator method', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncDisposableProbeTest = {
  probe: AsyncDisposableProbe,
  positive: [
    { name: 'custom with async dispose method', 
      value: new (class { [Symbol.asyncDispose]() { } })() },
  ],
  negative: [
    { name: 'object literal', value: { } },
    { name: 'array', value: [] },
  ]
}
const AsyncFunctionProbeTest = {
  probe: AsyncFunctionProbe,
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
const AsyncGeneratorFunctionProbeTest = {
  probe: AsyncGeneratorFunctionProbe,
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
  PojoProbeTest,
  NojoProbeTest,
  IterableProbeTest,
  IteratorProbeTest,
  ErrorProbeTest,
  DisposableProbeTest,
  AbortSignalProbeTest,
  EventEmitterProbeTest,
  EventTargetProbeTest,
  DateProbeTest,
  RegExpProbeTest,
  
  GeneratorFunctionProbeTest,
  CallableProbeTest,
  ClassConstructorProbeTest,
  ConstructorProbeTest,
  FunctionConstructorProbeTest,
  
  PromiseProbeTest,
  ThenableProbeTest,
  AsyncIterableProbeTest,
  AsyncDisposableProbeTest,
  AsyncFunctionProbeTest,
  AsyncGeneratorFunctionProbeTest,
]

describe.each(Tests)("$probe.name", ({ probe, positive, negative }) => {
  for (const { name, value } of positive) {
    it(`is ${name}`, () => {
      expect(value).toBeInstanceOf(probe)
    })  
  }
  for (const { name, value } of negative) {
    it(`is not ${name}`, () => {
      expect(value).not.toBeInstanceOf(probe)
    })  
  }
})

describe('Probes', () => {
  it('should not be instantiable', () => {
    expect(() => new Probe()).toThrow(
      'Metadata cannot be instantiated.')
  })
  it('should be false if null or undefined', () => {
    expect(null).not.toBeInstanceOf(PojoProbe)
    expect(undefined).not.toBeInstanceOf(PojoProbe)
  })
  it('should be false for Probe itself', () => {
    expect({ }).not.toBeInstanceOf(Probe)
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
      expect(fn).not.toBeInstanceOf(ConstructorProbe)
    })
    it('should be false if enumerable is true', () => {
      Object.defineProperty(fn, 'prototype', { enumerable: true })
      Object.defineProperty(fn, 'prototype', { configurable: false })
      expect(fn).not.toBeInstanceOf(ConstructorProbe)
    })
    describe('that is not configurable', () => {
      beforeEach(() => {
        Object.defineProperty(fn, 'prototype', { configurable: false })
      })
      it('should be false if no value descriptor', () => {
        Object.defineProperty(fn, 'prototype', { value: undefined })
        expect(fn).not.toBeInstanceOf(ConstructorProbe)
      })
      it('should be false if prototype is not an object', () => {
        fn.prototype = 42
        expect(fn).not.toBeInstanceOf(ConstructorProbe)
      })
      it('should be false if prototype is null', () => {
        fn.prototype = null
        expect(fn).not.toBeInstanceOf(ConstructorProbe)
      })
      it('should be false if prototype.constructor is not the function', () => {
        fn.prototype = { constructor: function() { } }
        expect(fn).not.toBeInstanceOf(ConstructorProbe)
      })
    })  
  })
})
