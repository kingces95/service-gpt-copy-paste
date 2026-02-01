const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassPojo = {
  name: 'MyClass',
  base: 'MyBase',
  members: {
    conceptual: {
      MyConcept: { methods: { myConceptMethod: { host: '.' } } },
      MyBaseConcept: { methods: { myBaseConceptMethod: { host: 'MyBase' } } },
      MyLeftConcept: {
        methods: {
          myLeftConceptMethod: { host: 'MyBase' },
          myAmbidextrousMethod: { host: 'MyBase' }
        }
      },
      MyRightConcept: {
        methods: {
          myAmbidextrousMethod: { host: 'MyBase' },
          myRightConceptMethod: { host: 'MyBase' }
        }
      }
    },
    methods: {
      myMethod: { host: '.' },
      myAbstractMethod: { host: '.', isAbstract: true },
      myBaseMethod: { host: '.' },
      myNewMethod: { host: '.' },
      [MySymbol]: { host: '.' }
    },
    properties: { myAccessor: { host: '.' } }
  },
  staticMembers: {
    methods: {
      myStaticMethod: { host: '.' },
      myStaticBaseMethod: { host: 'MyBase' },
      [MyStaticSymbol]: { host: '.' }
    },
    properties: { myStaticAccessor: { host: '.' } }
  }
}