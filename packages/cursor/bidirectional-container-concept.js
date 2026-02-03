export default _ = {
  name: 'BidirectionalContainerConcept',
  base: 'ForwardContainerConcept',
  isAbstract: true,
  isConcept: true,
  members: {
    conceptual: {
      RangeConcept: { methods: { toRange: { host: '.', isAbstract: false } } },
      ContainerConcept: {
        methods: { toRange: { host: '.', isAbstract: false } },
        getters: {
          isEmpty: { host: '.', isAbstract: false },
          begin: { host: '.' },
          end: { host: '.' }
        }
      }
    }
  }
}