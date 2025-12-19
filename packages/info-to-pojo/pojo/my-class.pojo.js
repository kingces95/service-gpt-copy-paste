const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassPojo = {
  name: 'MyClass',
  base: 'MyBase',
  members: {
    conceptual: {
      MyConcept: {
        methods: {
          myConceptMethod: { type: 'method', host: 'MyClass', rootHost: 'MyBase' }
        }
      },
      MyBaseConcept: {
        methods: { myBaseConceptMethod: { type: 'method', host: 'MyBase' } }
      },
      MyLeftConcept: {
        methods: {
          myLeftConceptMethod: { type: 'method', host: 'MyBase', isAbstract: true },
          myAmbidextrousMethod: { type: 'method', host: 'MyBase', isAbstract: true }
        }
      },
      MyRightConcept: {
        methods: {
          myAmbidextrousMethod: { type: 'method', host: 'MyBase', isAbstract: true },
          myRightConceptMethod: { type: 'method', host: 'MyBase', isAbstract: true }
        }
      }
    },
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
        myMethod: { type: 'method', host: 'MyClass' },
        myAbstractMethod: { type: 'method', host: 'MyClass', isAbstract: true },
        myBaseMethod: { type: 'method', host: 'MyClass', rootHost: 'MyBase' },
        myNewMethod: { type: 'method', host: 'MyClass' },
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
  }
}
