import { isAbstract } from "@kingjs/abstract";

export const myConceptPojo = {
  name: 'MyConcept',
  base: 'Concept',
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