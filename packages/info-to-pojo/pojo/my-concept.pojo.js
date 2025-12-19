export const myConceptPojo = {
  name: 'MyConcept',
  base: 'Concept',
  members: {
    conceptual: {
      MyBaseConcept: {
        methods: {
          myBaseConceptMethod: { type: 'method', host: 'MyConcept', isAbstract: true }
        }
      },
      MyLeftConcept: {
        methods: {
          myLeftConceptMethod: { type: 'method', host: 'MyConcept', isAbstract: true },
          myAmbidextrousMethod: { type: 'method', host: 'MyConcept', isAbstract: true }
        }
      },
      MyRightConcept: {
        methods: {
          myAmbidextrousMethod: { type: 'method', host: 'MyConcept', isAbstract: true },
          myRightConceptMethod: { type: 'method', host: 'MyConcept', isAbstract: true }
        }
      }
    },
    instance: {
      methods: {
        myConceptMethod: { type: 'method', host: 'MyConcept', isAbstract: true }
      }
    }
  }
}
