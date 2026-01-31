import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Associate } from '@kingjs/associate'

describe('MyClass that extends MyBase with MySymbol, MyType', () => {
  let myClass
  let mySymbol
  let myBase
  let myType
  let myBaseType
  let myMetadata
  beforeEach(() => {
    myBase = class MyBase { }
    myClass = class MyClass extends myBase { } 
    myBaseType = class MyBaseType { }
    myType = class MyType extends myBaseType { }
    mySymbol = Symbol.for('mySymbol')
    myMetadata = { [mySymbol]: { } }
  })

  describe('with metadata as an argument...', () => {
    describe('when associated declaratively...', () => {
      describe('on MyClass...', () => {
        beforeEach(() => {
          myClass[mySymbol] = myType
        })
        it('is directly associated', () => {
          const associated = [...Associate.ownTypes(myClass, myMetadata)]
          expect(associated).toEqual([ myType ])
        })
        describe('with a mapping...', () => {
          let myOtherType 
          beforeEach(() => {
            myOtherType = class MyOtherType { }
            myMetadata[mySymbol].map = (obj) => {
              if (obj == myType) return myOtherType
            }
          })
          it('maps to the other type', () => {
            const associated = [...Associate.ownTypes(myClass, myMetadata)]
            expect(associated).toEqual([ myOtherType ])
          })
        })
        describe('with an unexpected type...', () => {
          beforeEach(() => {
            myClass[mySymbol] = class MyOtherType { }
            myMetadata[mySymbol].expectedType = [ myBaseType ]
          })
          it('throws', () => {
            expect(() => {
              [...Associate.ownTypes(myClass, myMetadata)]
            }).toThrow()
          })
        })
        describe('with an expected type...', () => {
          beforeEach(() => {
            myMetadata[mySymbol].expectedType = [ myBaseType ]
          })
          it('is directly associated', () => {
            const associated = [...Associate.ownTypes(myClass, myMetadata)]
            expect(associated).toEqual([ myType ])
          })
        })
        // describe('with MyEdgeClass as an expected type...', () => {
        //   let myEdgeClass
        //   beforeEach(() => {
        //     myEdgeClass = class MyEdgeClass { }
        //     myEdgeClass[mySymbol] = [ myClass, myClass ]
        //   })
        //   it('is transitively associated', () => {
        //     const associated = [...Associate.types(
        //       myEdgeClass, myMetadata, { traverse: true })]
        //     expect(new Set(associated)).toEqual(new Set([ 
        //       myType, myClass ]))
        //   })
        // })
      })
      describe('on MyBase...', () => {
        beforeEach(() => {
          myBase[mySymbol] = myType
        })
        it('is associated', () => {
          const associated = [...Associate.types(myClass, myMetadata)]
          expect(associated).toEqual([ myType ])
        })
        it('is not directly associated', () => {
          const associated = [...Associate.ownTypes(myClass, myMetadata)]
          expect(associated).toEqual([])
        })
      })
      describe('on Object...', () => {
        beforeEach(() => {
          Object[mySymbol] = myType
        })
        it('is associated', () => {
          const associated = [...Associate.types(myClass, myMetadata)]
          expect(associated).toEqual([ myType ])
        })
        it('is not directly associated', () => {
          const associated = [...Associate.ownTypes(myClass, myMetadata)]
          expect(associated).toEqual([])
        })
      })
    })
    describe('when associated procedurally...', () => {
      beforeEach(() => {
        Associate.objectInitialize(myClass, mySymbol, () => myType)
      })
      it('is associated', () => {
        const associated = [...Associate.ownTypes(myClass, myMetadata)]
        expect(associated).toEqual([ myType ])
      })
    })
  })
  describe('with metadata on MyClass...', () => {
    let myMetadataPtr
    beforeEach(() => {
      myMetadataPtr = Symbol.for('myMetadataPtr')
      myClass[myMetadataPtr] = myMetadata
    })
    describe('when associated declaratively...', () => {
      describe('on MyClass...', () => {
        beforeEach(() => {
          myClass[mySymbol] = myType
        })
        it('is directly associated', () => {
          const associated = [...Associate.ownTypes(
            myClass, myMetadataPtr)]
          expect(associated).toEqual([ myType ])
        })
      })
    })
  })
})

describe('MyClass with MyBase, MySymbol, MyKey, and MyValue', () => {
  let myClass
  let myBase
  let mySymbol
  let myKey
  let myValue
  beforeEach(() => {
    myKey = 'myKey'
    myValue = 'myValue'
    mySymbol = Symbol.for('myObject')
    myBase = class MyBase { }
    myClass = class MyClass extends myBase { }
  })

  describe('has no associated...', () => {
    it('object', () => {
      const associated = Associate.objectGet(myClass, mySymbol)
      expect(associated).toBeUndefined()
    })
    it('set', () => {
      const associated = [...Associate.setGet(myClass, mySymbol)]
      expect(associated).toEqual([])
    })
    it('map', () => {
      const associated = Associate.mapGet(myClass, mySymbol, myKey)
      expect(associated).toBeUndefined()
    })
    it('lookup', () => {
      const associated = [...Associate.lookupGet(myClass, mySymbol, myKey)]
      expect(associated).toEqual([])
    })
  })

  describe('after declared association on MyClass with...', () => {
    describe('object', () => {
      beforeEach(() => {
        myClass[mySymbol] = myValue
      })
      it('value is associated', () => {
        const associated = Associate.objectGet(myClass, mySymbol)
        expect(associated).toBe(myValue)
      })
    })
  })

  describe('after association on MyClass with...', () => {
    describe('object', () => {
      beforeEach(() => {
        Associate.objectInitialize(myClass, mySymbol, () => myValue)
      })
      it('value is associated', () => {
        const associated = Associate.objectGet(myClass, mySymbol)
        expect(associated).toBe(myValue)
      })
      it('value is directly associated', () => {
        const associated = Associate.objectGetOwn(myClass, mySymbol)
        expect(associated).toBe(myValue)
      })
    })
    describe('set', () => {
      beforeEach(() => {
        Associate.setAdd(myClass, mySymbol, myValue)
      })
      it('value is associated', () => {
        const associated = [...Associate.setGet(myClass, mySymbol)]
        expect(associated).toEqual([ myValue ])
      })
      it('value is directly associated', () => {
        const associated = [...Associate.setGetOwn(myClass, mySymbol)]
        expect(associated).toEqual([ myValue ])
      })
    })
    describe('map', () => {
      beforeEach(() => {
        Associate.mapSet(myClass, mySymbol, myKey, myValue)
      })
      it('value is associated', () => {
        const associated = Associate.mapGet(myClass, mySymbol, myKey)
        expect(associated).toBe(myValue)
      })
      it('value is directly associated', () => {
        const associated = Associate.mapGetOwn(myClass, mySymbol, myKey)
        expect(associated).toBe(myValue)
      })
    })
    describe('lookup', () => {
      beforeEach(() => {
        Associate.lookupAdd(myClass, mySymbol, myKey, myValue)
      })
      it('value is associated', () => {
        const associated = [...Associate.lookupGet(myClass, mySymbol, myKey)]
        expect(associated).toEqual([ myValue ])
      })
      it('value is directly associated', () => {
        const associated = [...Associate.lookupGetOwn(myClass, mySymbol, myKey)]
        expect(associated).toEqual([ myValue ])
      })
    })
  })

  describe('after association on MyBase with...', () => {
    describe('object', () => {
      beforeEach(() => {
        Associate.objectInitialize(myBase, mySymbol, () => myValue)
      })
      it('value is associated', () => {
        const associated = Associate.objectGet(myClass, mySymbol)
        expect(associated).toBe(myValue)
      })
      it('value is not directly associated', () => {
        const associated = Associate.objectGetOwn(myClass, mySymbol)
        expect(associated).toBeUndefined()
      })
    })
    describe('set', () => {
      beforeEach(() => {
        Associate.setAdd(myBase, mySymbol, myValue)
      })
      it('value is associated', () => {
        const associated = [...Associate.setGet(myClass, mySymbol)]
        expect(associated).toEqual([ myValue ])
      })
      it('value is not directly associated', () => {
        const associated = [...Associate.setGetOwn(myClass, mySymbol)]
        expect(associated).toEqual([])
      })
    })
    describe('map', () => {
      beforeEach(() => {
        Associate.mapSet(myBase, mySymbol, myKey, myValue)
      })
      it('value is associated', () => {
        const associated = Associate.mapGet(myClass, mySymbol, myKey)
        expect(associated).toBe(myValue)
      })
      it('value is not directly associated', () => {
        const associated = Associate.mapGetOwn(myClass, mySymbol, myKey)
        expect(associated).toBeUndefined()
      })
    })
    describe('lookup', () => {
      beforeEach(() => {
        Associate.lookupAdd(myBase, mySymbol, myKey, myValue)
      })
      it('value is associated', () => {
        const associated = [...Associate.lookupGet(myClass, mySymbol, myKey)]
        expect(associated).toEqual([ myValue ])
      })
      it('value is not directly associated', () => {
        const associated = [...Associate.lookupGetOwn(myClass, mySymbol, myKey)]
        expect(associated).toEqual([])
      })
    })
  })

  describe('after similar association on MyClass and MyBase with...', () => {
    describe('set', () => {
      beforeEach(() => {
        Associate.setAdd(myClass, mySymbol, myValue)
        Associate.setAdd(myBase, mySymbol, myValue)
      })
      it('value is associated once', () => {
        const associated = [...Associate.setGet(myClass, mySymbol)]
        expect(associated).toEqual([ myValue ])
      })
    })
    describe('lookup', () => {
      beforeEach(() => {
        Associate.lookupAdd(myClass, mySymbol, myKey, myValue)
        Associate.lookupAdd(myBase, mySymbol, myKey, myValue)
      })
      it('value is associated once', () => {
        const associated = [...Associate.lookupGet(myClass, mySymbol, myKey)]
        expect(associated).toEqual([ myValue ])
      })
    })
    describe('map', () => {
      beforeEach(() => {
        Associate.mapSet(myClass, mySymbol, myKey, myValue)
        Associate.mapSet(myBase, mySymbol, myKey, myValue)
      })
      it('value is associated once', () => {
        const associated = Associate.mapGet(myClass, mySymbol, myKey)
        expect(associated).toBe(myValue)
      })
    })
  })
  
  describe('after dissimilar association on MyClass and MyBase with...', () => {
    let myBaseValue
    beforeEach(() => {
      myBaseValue = 'myBaseValue'
    })

    describe('object', () => {
      beforeEach(() => {
        Associate.objectInitialize(myBase, mySymbol, () => myBaseValue)
        Associate.objectInitialize(myClass, mySymbol, () => myValue)
      })
      it('value is associated', () => {
        const associated = Associate.objectGet(myClass, mySymbol)
        expect(associated).toBe(myValue)
      })
    })
    describe('map', () => {
      beforeEach(() => {
        Associate.mapSet(myBase, mySymbol, myKey, myBaseValue)
        Associate.mapSet(myClass, mySymbol, myKey, myValue)
      })

      it('value is associated', () => {
        const associated = Associate.mapGet(myClass, mySymbol, myKey)
        expect(associated).toBe(myValue)
      })
    })
    describe('set', () => {
      beforeEach(() => {
        Associate.setAdd(myBase, mySymbol, myBaseValue)
        Associate.setAdd(myClass, mySymbol, myValue)
      })
      it('value and myBaseValue are associated', () => {
        const associated = [...Associate.setGet(myClass, mySymbol)]
        expect(new Set(associated)).toEqual(new Set([ myBaseValue, myValue ]))
      })
    })
    describe('lookup', () => {
      beforeEach(() => {
        Associate.lookupAdd(myBase, mySymbol, myKey, myBaseValue)
        Associate.lookupAdd(myClass, mySymbol, myKey, myValue)
      })
      it('value and myBaseValue are associated', () => {
        const associated = [...Associate.lookupGet(myClass, mySymbol, myKey)]
        expect(new Set(associated)).toEqual(new Set([ myBaseValue, myValue ]))
      })
    })
  })
})
