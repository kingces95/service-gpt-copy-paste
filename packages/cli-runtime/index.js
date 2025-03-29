import { CliServiceProvider } from '@kingjs/cli'
import { CliCommand } from '@kingjs/cli-command'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'

export class CliRuntime extends CliServiceProvider {
  static async activate(classOrPojo, options = { }) {
    const { metadata } = options
    const isClass = typeof classOrPojo == 'function'
    const class$ = isClass ? classOrPojo : CliCommand.extend(classOrPojo)
    const cachedMetadata = CliClassMetadata.fromMetadataPojo(
      metadata ?? await (
        await CliClassMetadata.fromClass(class$)
      ).toPojo()
    )
    const info = CliCommandInfo.fromMetadata(cachedMetadata)
    return new CliRuntime({ class$, info })
  }
  static { this.initialize(import.meta) }

  #class // CliCommand
  #info // CliCommandInfo

  constructor({ class$, info } = { }) {
    if (CliRuntime.initializing(new.target))
      return super()
    super({ _services: []})

    this.#class = class$
    this.#info = info
  }

  get class() { return this.#class }
  get info() { return this.#info }

  async execute(path, argv) {
    const command = await this.#class.getRuntimeCommand(...path)
    const info = await this.#info.getRuntimeCommand(...path)
    const args = await info.getRuntimeArgs(argv)
    const options = args.at(-1)

    const services = options._services = new Map()
    for (const [_, providerClass] of 
      command.getServiceProviderClasses({ recurse: true })) {
      const runtimeProviderClass = await providerClass.getRuntimeClass(options)
      const serviceProvider = new runtimeProviderClass(options)
      const service = await serviceProvider.activate(this)
      services.set(providerClass, service)
    }
    
    const runtimeClass = await command.getRuntimeClass(options)
    return new runtimeClass(...args)
  }

  activate(runtime) { return runtime }
}
