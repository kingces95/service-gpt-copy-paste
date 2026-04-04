import { assert } from '@kingjs/assert'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept } from "@kingjs/concept"
import { ConceptReflect } from '@kingjs/concept-reflect'
import { PartialClass } from '@kingjs/partial-class'

export class InfoReflect {

  // PartialReflect proxies
  static typeof(type, key, descriptor, { isStatic } = { }) {
    return PartialReflect.typeof(type, key, descriptor, { isStatic })
  }
  static isAbstract(type) {
    return PartialReflect.isAbstract(type)
  }

  static *keys(type, { isStatic } = { }) {
    yield* PartialReflect.keys(type, { isStatic })
  }
  static *ownKeys(type, { isStatic } = { }) { 
    yield* PartialReflect.ownKeys(type, { isStatic })
  }

  static getOwnDescriptor(type, key, { isStatic } = { }) { 
    return PartialReflect.getOwnDescriptor(type, key, { isStatic })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    yield* PartialReflect.ownDescriptors(type, { isStatic })
  }

  static *getDescriptor(type, key, { isStatic } = { }) { 
    yield* PartialReflect.getDescriptor(type, key, { isStatic })
  }
  static *descriptors(type, { isStatic } = { }) { 
    yield* PartialReflect.descriptors(type, { isStatic })
  }

  static getExtendedType(type) {
    return PartialReflect.getExtendedType(type)
  }

  static *partialClasses(type) {
    // yield* PartialReflect.partialClasses(type)
    for (const current of PartialReflect.baseTypes(type)) {
      if (!PartialReflect.isExtensionOf(current, PartialClass)) continue
      yield current
    }
  }
  static isKnown(type) { 
    return PartialReflect.isKnown(type)
  }
  
  static *concepts(type) {
    for (const current of PartialReflect.baseTypes(type)) {
      if (!PartialReflect.isExtensionOf(current, Concept)) continue
      yield current
    }
  }

  // ConceptReflect proxies
  static *associatedConcepts(type) {
    yield* ConceptReflect.ownAssociatedConcepts(type)
  }
  static *ownAssociatedConcepts(type) {
    yield* ConceptReflect.ownAssociatedConcepts(type)
  }

  // Es6Reflect proxies
  static getMetadata(type) {
    return Metadata.get(type)
  }
}

export class GetterMd {
  static Type = 'getter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class SetterMd { 
  static Type = 'setter'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class PropertyMd { 
  static Type = 'property'
  static DefaultConfigurable = true
  static DefaultEnumerable = false
}
export class FieldMd { 
  static Type = 'field'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = true
}
export class MethodMd { 
  static Type = 'method'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = false
}
export class ConstructorMd { 
  static Type = 'constructor'
  static DefaultConfigurable = true
  static DefaultWritable = true
  static DefaultEnumerable = false
}
export class PrototypeMd { 
  static Type = 'prototype'
  static DefaultConfigurable = false
  static DefaultWritable = false
  static DefaultEnumerable = false
}

const Metadata = new Map([
  [FieldMd.Type, FieldMd],
  [MethodMd.Type, MethodMd],
  [GetterMd.Type, GetterMd],
  [SetterMd.Type, SetterMd],
  [PropertyMd.Type, PropertyMd],
  [ConstructorMd.Type, ConstructorMd],
  [PrototypeMd.Type, PrototypeMd],
])