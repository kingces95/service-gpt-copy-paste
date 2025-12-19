import { Es6Info } from "@kingjs/es6-info"
import { } from "@kingjs/es6-info-to-pojo"

const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

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

const [AnonymousClass] = [class { }]

// attach abstract method to MyClass
Object.defineProperty(MyBase.prototype, 'myFunkyMethod', {
  value: () => {},
  writable: false,
  enumerable: false,
  configurable: false,
})

function dump(fn) {
  const fnInfo = Es6Info.from(fn)
  const name = fnInfo.name 
  fnInfo.dump({
    ownOnly: false,
    filter: [{ 
      isStatic: true,
      isKnown: true,
      //isNonPublic: true,
    }],
  })
}

// Used to generate *.pojo.js files:
// dump(Object)
// dump(Function)
// dump(MyBase)
// dump(MyClass)
dump(AnonymousClass)

