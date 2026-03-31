import { PartialReflect } from '@kingjs/partial-reflect'
import { ConceptReflect } from "@kingjs/concept"
import { PartialClassReflect } from '@kingjs/partial-class'
import { PartialTypeReflect } from '@kingjs/partial-type'

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

  // PartialTypeReflect proxies
  static isKnown(type) { 
    return PartialTypeReflect.isKnown(type)
  }
  static baseType(type) { 
    return PartialTypeReflect.baseType(type)
  }

  // PartialClassReflect proxies
  static *ownPartialClasses(type) {
    yield* PartialClassReflect.ownPartialClasses(type)
  }
  static *partialClasses(type) {
    yield* PartialClassReflect.partialClasses(type)
  }

  // ConceptReflect proxies
  static *concepts(type) {
    yield *ConceptReflect.concepts(type)
  }
  static *getConceptOwnHosts(type, name) {
    yield *ConceptReflect.getConceptOwnHosts(type, name)
  }
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