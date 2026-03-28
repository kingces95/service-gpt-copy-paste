import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { ExtensionsReflect } from '@kingjs/extensions'

export class PartialPrototype extends Es6Prototype {
  static #cache

  static {
    PartialPrototype.#cache = new Es6PrototypeCache(type => {
    })
  }

  static getPrototype(type) {
    assert(PartialTypeReflect.isPartialType(type))
    if (ExtensionsReflect.isTransparent(type)) 
      return this.#createPrototype(type)

    return this.#cache.getPrototype(type)
  }

  static #createPrototype(type) {
    // To be javascript-ish this multi-extensible loader exposes 
    // a declarative representation, a "partial prototype", of the 
    // method table which answers many of the same questions a normal 
    // single-extensible prototype answers. For example,
    //    - What are the own/inherited keys/descriptors of the type?
    //    - What types does the type extend?
    //    - What members are overloaded and which take precidence?

    // The above questions are answered using a partial prototype with
    // the same ergonomics as the normal prototype. For example, a user 
    // would reflect on the partial prototype to get the own/inherited 
    // keys/descriptors the same way as would be done with a normal 
    // prototype chain. The same goes for collecting the extended types 
    // and establishing which member of which extended type takes 
    // precedence over other members.

    // The partial prototype must necessarily sacrifice some ergonomics
    // provided by the normal prototype. For example, there is not a 
    // one-to-one relationship between a partial prototype and its type.
    // Instead, only the first link in the chain has a one-to-one 
    // relationship with the type. Subsequent links contain copies of the 
    // keys/descriptors of the first link of their respective partial type.
    // Put another way, there are many partial prototype links for a given
    // type and while they all share the same key/descriptors they have
    // different next links. 

    // Practically, this all means that public APIs should not take a 
    // prototype link as an argument. Instead, APIs should take a type so 
    // they may get the prototype link themselves from the type. In this way, 
    // the API gets the *first* link of the chain which does have a one-to-one
    // relationship with the type and can be used to answer the same 
    // questions as a normal prototype with the same ergonomics; APIs
    // cannot assume a prototype link is the *first* link in the prototype
    // chain and so cannot use it to answer questions about the type 
    // returned by the constructor property.

    const plan = PartialLoader.getPlan(type)

    // Note: Host is null iff type is transparent. In this case, the plan as a
    // single step and the prototype degenerates to a bag of keys/descriptors 
    // with no prototype chain. This prototype should not be cached since 
    // it is only referenced by the type that declared it.
    
    let prototype = Object.create(null)
    for (let { host, transparent, descriptors$ } of plan) {

      if (host && host != type) {
        if (transparent) continue
        Object.defineProperties(prototype, 
          Object.getOwnPropertyDescriptors(
            this.#createPrototype(host)))
        prototype = Object.create(prototype)
        continue
      }

      Object.defineProperties(prototype, descriptors$)
    }

    // Note: The last step of the plan is always the type itself since the plan
    // is reversed depth-first deduplicated *post-order* walk of the type's 
    // partial types. This means the constructor property is always defined by 
    // the last step of the plan and so it is safe to set it here without 
    // worrying about overwriting an existing constructor property.

    prototype.constructor = type
    Object.defineProperty(prototype, 'constructor', { enumerable: false })
    return prototype
  }

  constructor({
    knownKeys = [],
    knownTypes = [],
  }) {
    // .constructor is reserved for static members since it is needed
    // to construct the prototype chain.
    knownKeys.push('constructor')

    super({
      getPrototypeFn: type => Es6StaticPrototype.getPrototype(type),
      knownTypes,
      knownKeys,
    })
  }

  typeof(type, key, descriptor) {
    return Es6Descriptor.typeof(descriptor)
  }
}
