import { PartialReflect } from '@kingjs/partial-reflect'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { ConceptReflect } from "@kingjs/concept"
import { PartialClassReflect } from '@kingjs/partial-class'
import { PartialTypeReflect } from '@kingjs/partial-type'

export class InfoReflect {

  // Es6Reflect proxies
  static typeof(type, key, descriptor, { isStatic } = { }) {
    return Es6Reflect.typeof(type, key, descriptor, { isStatic })
  }
  static getMetadata(type) {
    return Es6Reflect.getMetadata(type)
  }
  static isAbstract(type) {
    return Es6Reflect.isAbstract(type)
  }

  // PartialTypeReflect proxies
  static isKnown(type) { 
    return PartialTypeReflect.isKnown(type)
  }
  static baseType(type) { 
    return PartialTypeReflect.baseType(type)
  }

  // PartialReflect proxies
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

  static *ownPartialTypes(type) {
    yield* PartialReflect.ownPartialTypes(type)
  }
  static *partialTypes(type) {
    yield* PartialReflect.partialTypes(type)
  }

  // PartialClassReflect proxies
  static *ownPartialClasses(type) {
    yield* PartialClassReflect.ownPartialClasses(type)
  }
  static *partialClasses(type) {
    yield* PartialClassReflect.partialClasses(type)
  }
  static getPartialClass(type, name) {
    return PartialClassReflect.getPartialClass(type, name)
  }

  // ConceptReflect proxies
  static *concepts(type) {
    yield *ConceptReflect.concepts(type)
  }
  static *ownConcepts(type) {
    yield *ConceptReflect.ownConcepts(type)
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
}