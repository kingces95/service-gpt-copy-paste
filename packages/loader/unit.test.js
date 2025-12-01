// import { describe, it, expect } from 'vitest'
// import { beforeEach } from 'vitest'
// import { ExtensionGroup } from '@kingjs/extension-group'
// import { Concept } from "@kingjs/concept"
// import { Extensions, Concepts, load } from '@kingjs/loader'

// class MyPart extends ExtensionGroup { 
//   partMethod() { }
// }

// class MyConcept extends Concept { 
//   conceptMethod() { }
// }

// describe('A type with parts and concepts', () => {
//   let type
//   beforeEach(() => {
//     [type] = [class { 
//       static [Extensions] = [ MyPart ]
//       static [Concepts] = [ MyConcept ]
//       static { load(this) }
//     }]
//   })
//   it('should have members from parts and concepts', () => {
//     const prototype = type.prototype
//     expect(typeof prototype.partMethod).toBe('function')
//     expect(typeof prototype.conceptMethod).toBe('function')
//   })
// })