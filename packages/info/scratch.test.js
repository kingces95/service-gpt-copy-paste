import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"
import { dumpPojo } from "@kingjs/pojo-dump"
import { abstract } from "@kingjs/abstract"

const MySymbol = Symbol('my-symbol')
const MyStaticSymbol = Symbol('my-static-symbol')

class MyBase {
  static myStaticInheritedMethod() { }
  myInheritedMethod() { }
}

class MyClass extends MyBase {
  static get myStaticAccessor() { }
  static set myStaticAccessor(value) { }
  static myStaticMethod() { }
  static _myStaticMethod() { }
  
  get myAccessor() { }
  set myAccessor(value) { }
  myMethod() { }
  _myMethod() { }
  myAbstractMethod() { }

  [MySymbol]() { }
  static [MyStaticSymbol]() { }
}

// attach abstract method to MyClass
Object.defineProperty(MyBase.prototype, 'myAbstractMethod', {
  value: abstract,
  writable: true,
  enumerable: false,
  configurable: true,
})

const fnInfo = Info.from(MyClass)
// fnInfo.__dump()

fnInfo.__toPojo().then(pojo => { 
  pojo = filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
    },
    includeStatic: {
      isInherited: true,
      // isSymbol: true,
    }
  })
  //pojo = filterInfoPojo(pojo)
  
  dumpPojo(pojo)
})
