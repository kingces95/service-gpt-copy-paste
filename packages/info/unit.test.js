import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"

import { abstract } from '@kingjs/abstract'

describe('FunctionInfo for Object', () => {
  let fnInfo
  beforeEach(() => {
    fnInfo = Info.from(Object)
  })
  it('should have a ctor which is Object', () => {
    expect(fnInfo.ctor).toBe(Object)
  })
  it('does not equal null', () => {
    expect(fnInfo.equals(null)).toBe(false)
  })
  it('does not have a member missing', () => {
    expect(fnInfo.getOwnMember('missing')).toBeUndefined()
    expect(FunctionInfo.getMember(fnInfo, 'missing')).toBeUndefined()
  })
  describe('has a toString member', () => {
    let toStringMember
    beforeEach(() => {
      toStringMember = fnInfo.getOwnMember('toString')
    })
    it('has no root type', () => {
      const rootType = toStringMember.rootHost()
      expect(rootType).toBeNull()
    })
  })
  describe('has a constructor member', () => {
    let ctorMember
    beforeEach(() => {
      ctorMember = fnInfo.getOwnMember('constructor')
    })

    it('equals itself', () => {
      expect(ctorMember.equals(ctorMember)).toBe(true)
    })
    it('equals a different instance of itself', () => {
      expect(ctorMember.equals(fnInfo.getOwnMember('constructor'))).toBe(true)
    })
    it('does not equal null', () => {
      expect(ctorMember.equals(null)).toBe(false)
    })

    describe('has a hasOwnProperty member', () => {
      let hasOwnPropertyMember
      beforeEach(() => {
        hasOwnPropertyMember = fnInfo.getOwnMember('hasOwnProperty')
      })
      it('does not equal the constructor member', () => {
        expect(hasOwnPropertyMember.equals(ctorMember)).toBe(false)
      })
    })
  })
})

const MySymbol = Symbol('test-symbol')

function filter(pojo) {
  return filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
    },
    includeStatic: {
      isInherited: true,
      // isSymbol: true,
    }
  })
}

describe('A class', () => {
  describe.each([
    ['no members', class { }, { }],
    ['static data', class { static myStaticMember = 1 }, {
      members: { static: { data: {
        myStaticMember: { type: 'data' } 
      } } },
    }],
    ['instance member', class { myInstanceMember = 1 }, { }],
    ['static getter', class {
      static get myStaticAccessor() { return 1 }
    }, {
      members: { static: { accessors: {
        myStaticAccessor: { type: 'accessor', hasGetter: true  }
      } } },
    }],
    ['instance setter', class {
      set myInstanceAccessor(value) { }
    }, {
      members: { instance: { accessors: {
        myInstanceAccessor: { type: 'accessor', hasSetter: true }
      } } },
    }],
  ])('with %s', (description, cls, expected) => {
    it('has a pojo', async () => {
      const fnInfo = Info.from(cls)
      expect(filter(await fnInfo.__toPojo())).toEqual({
        ...expected,
        base: 'Object'
      })
    })
  })
})

describe('A bespoke class', () => {
  let myClass
  beforeEach(() => {
    [myClass] = [class { }]
  })
  describe('that implements MySymbol', () => {
    beforeEach(() => {
      myClass.prototype[MySymbol] = function* () { }
    })  
    it('has a pojo', async () => {
      const pojo = {
        members: { instance: { methods: {
          [MySymbol]: { 
            type: 'method',
            isEnumerable: true
          },
        } } },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.__toPojo()
      const actualPojo = filter(actual)
      expect(actualPojo).toEqual(pojo)
    })
  })  
  describe('extended by an extended class', () => {
    let myExtendedClass
    beforeEach(() => {
      [myExtendedClass] = [class extends myClass { }]
    })
    describe('which overrides toString on both the base and extended class', () => {
      beforeEach(() => {
        myClass.prototype.toString = function() { 
          return 'myClass' }
        myExtendedClass.prototype.toString = function() { 
          return 'myExtendedClass' }
      })

      it('should have Object as root of toString', async () => {
        const fnInfo = Info.from(myExtendedClass)
        const toStringMember = fnInfo.getOwnMember('toString')
        const object = FunctionInfo.Object
        expect(toStringMember.rootHost().equals(object)).toBe(true)
        expect(toStringMember.rootHost().name).toBe('Object')
      })
    })
  }) 
  describe('with static and explicit constructor members', () => {
    beforeEach(() => {
      myClass.constructor = function() { }
      myClass.prototype.constructor = function() { }
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { 
          instance: { methods: {
            constructor: { type: 'method', rootHost: 'Object' } 
          } },
          static: { methods: {
            constructor: { type: 'method', isEnumerable: true }
          } }
        },
        base: 'Object'
      }

      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with static const member', () => {
    beforeEach(() => {
      [myClass] = [class {
        static myStaticConst = 1
      }]
      // clear configurable and writable
      Object.defineProperty(myClass, 'myStaticConst', {
        configurable: false,
        writable: false,
      })
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { static: { data: {
          myStaticConst: { 
            type: 'data',
            isConfigurable: false,
            isWritable: false,
          }
        } } },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with static and instance data members', () => {
    beforeEach(() => {
      [myClass] = [class { 
        static myStaticData = 1
      }]
      myClass.prototype.myInstanceData = 2
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { 
          instance: { data: {
            myInstanceData: { 
              type: 'data', 
          } } },
          static: { data: {
            myStaticData: { 
              type: 'data', 
          } } },
        },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with private members', () => {
    beforeEach(() => {
      [myClass] = [class { 
        myPrivateMethod$() { }
        $myPrivateMethod() { }
        myPrivateMethod_() { }
        _myPrivateMethod() { }
      }]
    })
  
    it('has a pojo', async () => {
      const pojo = {
        base: 'Object'
      }
  
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with a static and instance accessor and method members', () => {
    beforeEach(() => {
      [myClass] = [class { 
        static get myAccessor() { }
        static set myAccessor(value) { }
        static myMethod() { }
        
        get myAccessor() { }
        set myAccessor(value) { }
        myMethod() { }
      }]
    })
  
    it('has a pojo', async () => {
      const pojo = {
        members: {
          instance: {
            accessors: {
              myAccessor: { type: 'accessor', hasGetter: true, hasSetter: true }
            },
            methods: {
              myMethod: { type: 'method' }
            }
          },
          static: {
            accessors: {
              myAccessor: { type: 'accessor', hasGetter: true, hasSetter: true }
            },
            methods: {
              myMethod: { type: 'method' }
            }
          }
        },
        base: 'Object'
      }
  
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with an abstract method and accessor', () => {
    beforeEach(() => {
      // assign abstract to method and accessor
      Object.defineProperties(myClass.prototype, {
        myAccessor: {
          get: abstract,
          set: abstract,
          configurable: true,
        },
        myMethod: {
          value: abstract,
          configurable: true,
          writable: true,
        },
      })
    })
    it('has a pojo', async () => {
      const pojo = {
        members: {
          instance: {
            accessors: {
              myAccessor: { 
                type: 'accessor', 
                hasGetter: true, 
                hasSetter: true, 
                isAbstract: true 
              }
            },
            methods: {
              myMethod: { type: 'method', isAbstract: true }
            }
          }
        },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
})

