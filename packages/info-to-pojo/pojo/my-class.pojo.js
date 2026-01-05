const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassPojo = {
  name: 'MyClass',
  base: 'MyBase',
  members: {
    conceptual: {
      MyConcept: { methods: { myConceptMethod: { host: '.' } } },
      MyLeftConcept: {
        methods: {
          myLeftConceptMethod: { isAbstract: true, host: 'MyBase' },
          myAmbidextrousMethod: { isAbstract: true, host: 'MyBase' }
        }
      },
      MyRightConcept: {
        methods: {
          myAmbidextrousMethod: { isAbstract: true, host: 'MyBase' },
          myRightConceptMethod: { isAbstract: true, host: 'MyBase' }
        }
      },
      MyBaseConcept: { methods: { myBaseConceptMethod: { host: 'MyBase' } } }
    },
    static: {
      methods: {
        myStaticMethod: { host: '.' },
        myStaticBaseMethod: { host: 'MyBase' },
        [MyStaticSymbol]: { host: '.' }
      },
      properties: { myStaticAccessor: { host: '.' } }
    },
    instance: {
      methods: {
        myMethod: { host: '.' },
        myAbstractMethod: { isAbstract: true, host: '.' },
        myBaseMethod: { host: '.' },
        myNewMethod: { host: '.' },
        [MySymbol]: { host: '.' }
      },
      properties: { myAccessor: { host: '.' } }
    }
  }
}
