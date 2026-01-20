export const myConceptPojo = {
  name: 'MyConcept',
  base: 'Concept',
  members: { 
    conceptual: {
      MyLeftConcept: {
        methods: {
          myLeftConceptMethod: { isAbstract: true, host: '.' },
          myAmbidextrousMethod: { isAbstract: true, host: '.' }
        }
      },
      MyRightConcept: {
        methods: {
          myAmbidextrousMethod: { isAbstract: true, host: '.' },
          myRightConceptMethod: { isAbstract: true, host: '.' }
        }
      },
      MyBaseConcept: {
        methods: { myBaseConceptMethod: { isAbstract: true, host: '.' } }
      }
    },
    methods: { myConceptMethod: { isAbstract: true, host: '.' } } 
  }
}