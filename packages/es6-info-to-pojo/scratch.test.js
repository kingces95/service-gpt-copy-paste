import { Es6Info } from "@kingjs/es6-info"
import { } from "@kingjs/es6-info-to-pojo"

const MySymbol = Symbol('my-symbol')
const MyStaticSymbol = Symbol('my-static-symbol')

export const myClassPojo = {
  name: 'MyClass',
  base: 'MyBase',
  records: {
    static: {
      methods: {
        myStaticMethod: { type: 'method', host: 'MyClass' },
        myStaticBaseMethod: { type: 'method', host: 'MyBase' },
        [MyStaticSymbol]: { type: 'method', host: 'MyClass' }
      },
      accessors: {
        myStaticAccessor: {
          type: 'accessor',
          host: 'MyClass',
          hasGetter: true,
          hasSetter: true
        }
      }
    },
    instance: {
      methods: {
        constructor: { type: 'method', host: 'MyClass', rootHost: 'Object' },
        myMethod: { type: 'method', host: 'MyClass' },
        myBaseMethod: { type: 'method', host: 'MyBase' },
        myFunkyMethod: {
          type: 'method',
          host: 'MyBase',
          isConfigurable: false,
          isWritable: false
        },
        [MySymbol]: { type: 'method', host: 'MyClass' }
      },
      accessors: {
        myAccessor: {
          type: 'accessor',
          host: 'MyClass',
          hasGetter: true,
          hasSetter: true
        }
      }
    }
  },
  toString: '[classInfo MyClass]'
}

export class MyBase {
  constructor() { }

  static myStaticBaseMethod() { }
  myBaseMethod() { }
}

export class MyClass extends MyBase {
  constructor() { }
  
  static get myStaticAccessor() { }
  static set myStaticAccessor(value) { }
  static myStaticMethod() { }
  static _myStaticMethod() { }
  
  get myAccessor() { }
  set myAccessor(value) { }
  myMethod() { }
  _myMethod() { }

  [MySymbol]() { }
  static [MyStaticSymbol]() { }
}

// attach abstract method to MyClass
Object.defineProperty(MyBase.prototype, 'myFunkyMethod', {
  value: () => {},
  writable: false,
  enumerable: false,
  configurable: false,
})

function dump(fn) {
  const fnInfo = Es6Info.from(fn)
  fnInfo.dump({
    filter: { 
      // isStatic: true,
      isKnown: false,
      isNonPublic: false,
      // includeInhertied: false,
    },
  })
}

// dump(Object)
// dump(Function)
// dump(MyBase)
// dump(MyClass)

