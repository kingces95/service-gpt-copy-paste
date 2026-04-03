import { isAbstract } from "@kingjs/abstract";

export const myConceptPojo = {
  base: 'Concept',
  name: 'MyConcept',
  isAbstract: true,
  isConcept: true,
  members: { 
    conceptual: {
      MyLeftConcept: {
        methods: {
          myLeftConceptMethod: { host: '.' },
          myAmbidextrousMethod: { host: '.' }
        }
      },
      MyRightConcept: {
        methods: {
          myAmbidextrousMethod: { host: '.' },
          myRightConceptMethod: { host: '.' }
        }
      },
      MyBaseConcept: {
        methods: { myBaseConceptMethod: { host: '.' } }
      }
    },
    methods: { myConceptMethod: { host: '.' } } 
  }
}