export const containers = [
  'ForwardList',
  'List',
  'Deque',
  'ArrayMap',
  'Vector',
  'UnorderedSet',
  'UnorderedMap',
]

export const support = {
  ContainerPart: containers,
  SizedContainerPart: [
    'List',
    'Deque',
    'ArrayMap',
    'Vector',
    'UnorderedSet',
    'UnorderedMap',
  ],
  IndexableContainerPart: ['Deque', 'ArrayMap', 'Vector'],
  ByteContainerPart: ['Vector'],
  CapacityContainerPart: ['Vector'],
  ReservableContainerPart: ['Vector'],
  ClearableContainerPart: containers,
  BulkAssignableContainerPart: [
    'ForwardList',
    'List',
    'Deque',
    'ArrayMap',
    'Vector',
  ],
  GapAssignableContainerPart: ['ArrayMap', 'Vector'],
  EditableContainerPart: ['List', 'Deque', 'ArrayMap', 'Vector'],
  BulkEditableContainerPart: ['Deque', 'ArrayMap', 'Vector'],
  FrontInsertableContainerPart: [
    'ForwardList',
    'List',
    'Deque',
    'ArrayMap',
    'Vector',
  ],
  BackInsertableContainerPart: ['List', 'Deque', 'ArrayMap', 'Vector'],
  PhasedContainerPart: ['ForwardList', 'List'],
  PhasedBulkContainerPart: ['ForwardList', 'List'],
  AssociativeContainerPart: ['UnorderedSet', 'UnorderedMap'],
  SetAssociativeContainerPart: ['UnorderedSet'],
  MapAssociativeContainerPart: ['UnorderedMap'],
}

export const roles = [
  ['Universal', [
    ['ContainerPart', ['isEmpty']],
  ]],
  ['Size', [
    ['SizedContainerPart', ['size']],
    ['IndexableContainerPart', ['at', 'setAt']],
    ['ByteContainerPart', ['span']],
  ]],
  ['Capacity', [
    ['CapacityContainerPart', ['capacity']],
    ['ReservableContainerPart', ['reserve']],
  ]],
  ['Assignment', [
    ['ClearableContainerPart', ['clear']],
    ['BulkAssignableContainerPart', ['resize', 'assignRange', 'assign']],
  ]],
  ['Mutation', [
    ['EditableContainerPart', ['insertValue', 'erase']],
    ['BulkEditableContainerPart', ['insertRange', 'insert', 'replaceRange']],
    ['FrontInsertableContainerPart', ['pushFront', 'popFront']],
    ['BackInsertableContainerPart', ['pushBack', 'popBack']],
    ['PhasedContainerPart', [
      'beforeBegin',
      'insertValueAfter',
      'eraseAfter',
    ]],
    ['PhasedBulkContainerPart', [
      'insertRangeAfter',
      'insertAfter',
      'replaceRangeAfter',
    ]],
  ]],
  ['Association', [
    ['AssociativeContainerPart', ['contains', 'erase']],
    ['SetAssociativeContainerPart', ['insert']],
    ['MapAssociativeContainerPart', ['at', 'insertOrAssign']],
  ]],
]
