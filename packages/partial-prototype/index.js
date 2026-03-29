import { Es6Prototype, Es6PrototypeCache } from '@kingjs/es6-prototype'
import { Es6Descriptor } from '@kingjs/es6-descriptor'
import { ExtensionsReflect } from '@kingjs/extensions'
import { PartialLoader } from '@kingjs/partial-loader'
import { PartialTypeReflect } from '@kingjs/partial-type'

export class PartialPrototype extends Es6Prototype {
  static getPrototype(type) {
    assert(PartialTypeReflect.isPartialType(type))
    if (ExtensionsReflect.isTransparent(type)) 
      return this.#createPrototype(type)

    return this.#cache.getPrototype(type)
  }

  static #createPrototype(partialType) {
    return PartialLoader.partialTypes(partialType)
      .reduce((prototype, partialType) => {
        const descriptors = { }
        for (const current of PartialLoader.ownPartialTypes(partialType)) {
          assert(typeof current == 'object'
            || typeof current == 'string' 
            || typeof current == 'symbol',
            `Unexpected type: ${typeof current}`)

          let ownKey
          switch (typeof current) {
            case 'string':
            case 'symbol':
              ownKey = current 
            break
            case 'object':
              // inherit existing descriptor if current is abstract
              if (isAbstract(current)) {
                const existing = descriptors[ownKey]
                if (existing && !isAbstract(existing))
                  current = existing
              }
              descriptors[ownKey] = current
              break
          }
        }
        return Es6Prototype.createLink(partialType, prototype, descriptors)
      }, null)
  }

  static #cache = new Es6PrototypeCache(partialType => {
    return this.#createPrototype(partialType)
  })

  constructor() {
    super({
      getPrototypeFn: type => Es6StaticPrototype.getPrototype(type),
    })
  }
}
