import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialLoader } from '@kingjs/partial-loader'

function *ownTypes(type, symbol) {
  yield* PartialLoader.declaredOwnPartialTypes$(type, symbol)
}

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
          const associated = [...ownTypes(myClass, myMetadata)]
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
            const associated = [...ownTypes(myClass, myMetadata)]
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
              [...ownTypes(myClass, myMetadata)]
            }).toThrow()
          })
        })
        describe('with an expected type...', () => {
          beforeEach(() => {
            myMetadata[mySymbol].expectedType = [ myBaseType ]
          })
          it('is directly associated', () => {
            const associated = [...ownTypes(myClass, myMetadata)]
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
        // it('is associated', () => {
        //   const associated = [...Associate.types(myClass, myMetadata)]
        //   expect(associated).toEqual([ myType ])
        // })
        it('is not directly associated', () => {
          const associated = [...ownTypes(myClass, myMetadata)]
          expect(associated).toEqual([])
        })
      })
      describe('on Object...', () => {
        beforeEach(() => {
          Object[mySymbol] = myType
        })
        // it('is associated', () => {
        //   const associated = [...Associate.types(myClass, myMetadata)]
        //   expect(associated).toEqual([ myType ])
        // })
        it('is not directly associated', () => {
          const associated = [...ownTypes(myClass, myMetadata)]
          expect(associated).toEqual([])
        })
      })
    })
    // describe('when associated procedurally...', () => {
    //   beforeEach(() => {
    //     Associate.objectInitialize(myClass, mySymbol, () => myType)
    //   })
    //   it('is associated', () => {
    //     const associated = [...ownTypes(myClass, myMetadata)]
    //     expect(associated).toEqual([ myType ])
    //   })
    // })
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
          const associated = [...ownTypes(
            myClass, myMetadataPtr)]
          expect(associated).toEqual([ myType ])
        })
      })
    })
  })
})
