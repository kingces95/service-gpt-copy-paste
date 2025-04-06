import { 
  CliService, CliServiceProvider, CliServiceThread 
} from '@kingjs/cli-service'
import { getOwn } from '@kingjs/get-own'

export class CliRuntimeContainer {
  #services
  #signal

  constructor(signal) {
    this.#services = new Map()
    this.#signal = signal
  }

  #getServiceSync(serviceClass, options) {
    const services = this.#services
    if (!services.has(serviceClass)) {
      if (!(serviceClass.prototype instanceof CliService))
        throw new Error(`Class ${serviceClass.name} must extend ${CliService.name}.`)
      
      const service = new serviceClass(options)
      if (service instanceof CliServiceThread)
        service.start(this.#signal)

      services.set(serviceClass, service)
    }
    return services.get(serviceClass)
  }

  #getService(providerClass, options) {
    const services = this.#services
    if (!services.has(providerClass)) {
      if (!(providerClass.prototype instanceof CliServiceProvider))
        throw new Error(`Class ${providerClass.name} must extedn ${CliServiceProvider.name}.`)
  
      const activator = new CliRuntimeActivator(providerClass)
      const serviceAsync = activator.activate(options)
        .then(async serviceProvider => {
          const service = await serviceProvider.activate()
          if (!service)
            throw new Exception(`Service provider ${providerClass.name} failed to provide a service.`)
          return service
        })
      
      services.set(providerClass, serviceAsync)
    }
    return services.get(providerClass)
  }

  getServices(class$, options = { }) {
    const result = {}
    for (const name of class$.ownServiceNames()) {
      const serviceClass = class$.getOwnService(name)
      const prototype = serviceClass.prototype
      if (prototype instanceof CliService) {
        result[name] = this.#getServiceSync(serviceClass, options)
      } else if (prototype instanceof CliServiceProvider) {
        result[name] = this.#getService(serviceClass, options)
      } else {
        throw new Error([
          `Class ${name} must extend`,
          `${CliService.name} or ${CliServiceProvider.name}.`
        ].join(' '))
      }
    }
    return result
  }
}

export class CliRuntimeActivator {
  #class
  #name
  #discriminations

  constructor(class$) {
    this.#class = class$
    // If class$ command has an option with a choice constraint, then that option can
    // be used as a discriminator to select an alternative command to activate.

    // The single choice which is an object instead of an array is a discriminator. 
    const choices = getOwn(class$, 'choices') ?? { 
      // myOption: [ 'left', 'right' ],
      // myDiscriminator: { foo: @kingjs/mycmd/foo, bar: @kingjs/mycmd/bar }
    }

    const ownDiscriminatingOption = Object.entries(choices)
      .find(([_, value]) => !Array.isArray(value)) ?? []

    const [name, discriminations] = ownDiscriminatingOption
    this.#name = name
    this.#discriminations = discriminations
  }

  get name() { return this.#name }
  get class() { return this.#class }
  get discriminations() { return this.#discriminations }

  async #getClass(options) {
    const { name, discriminations, class: class$ } = this
    if (!name) return class$

    const discriminator = options[name]
    const importOrObject = discriminations[discriminator]
    if (!importOrObject) 
      throw new Error(`Discriminator ${name} is ${discriminator} which is not ${Object.keys(discriminations).join(', ')}.`)

    // runtime class must be a derivation enclosing class
    const runtimeClass = await class$.loadOrDeclareClass([name, importOrObject])
    if (runtimeClass != class$ && !(runtimeClass.prototype instanceof class$))
      throw new Error(`Class ${runtimeClass.name} must extend ${class$.name}`)
    
    return runtimeClass
  }

  async activate(...args) {
    const options = args.at(-1)
    const class$ = await this.#getClass(options)
    return new class$(...args)
  }
}
