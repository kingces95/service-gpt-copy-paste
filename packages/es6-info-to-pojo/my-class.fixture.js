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

Object.defineProperty(MyBase.prototype, 'myFunkyMethod', {
  value: () => {},
  writable: false,
  enumerable: false,
  configurable: false,
})
