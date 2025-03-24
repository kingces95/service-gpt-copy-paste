// import { CliProvider } from '@kingjs/cli-provider'

export class CliContainer {
  static async *#topologicalSort(cli, visited = new Set()) {
    // Yield a topological sort of the providers such that dependencies are
    // yielded before dependents. This is done by walking the hierarchy of
    // the cli and yielding the providers of each level. Each service is itself
    // a cli and has its own service dependencies which are yielded first.
    
    for (const level of cli.hierarchy()) {
      for await (const class$ of level.getOwnServices()) {
        if (visited.has(class$)) continue
        visited.add(class$)

        // if (!class$.prototype instanceof CliProvider)
        //   throw new Error(`Provider ${class$.name} must extend CliProvider`)
          
        yield* CliContainer.#topologicalSort(class$, visited)
        yield class$
      }
    }
  }

  static async activate(cli, options) {
    const container = options._container = new CliContainer() 

    for await (const providerClass of CliContainer.#topologicalSort(cli)) {
      const runtimeClass = await providerClass.getRuntimeClass(options)
      const provider = new runtimeClass(options)
      const service = await provider.activate()
      container.#registerService(provider, service)
    }
  }

  #services

  constructor() {
    this.#services = []
  }

  #registerService(provider, service) {
    this.#services.push([provider, service])
  }

  getService(class$) {
    const [_, service] = this.#services.find(
      ([provider, _]) => provider instanceof class$)
    ?? []

    return service
  }
}
