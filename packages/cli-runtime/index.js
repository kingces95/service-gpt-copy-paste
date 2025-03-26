import { CliServiceProvider } from '@kingjs/cli'
import { CliCommand } from '@kingjs/cli-command'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'

export class CliRuntime {
  static async activate(classOrPojo, options = { }) {
    const { metadata } = options
    const isClass = typeof classOrPojo == 'function'
    const tool = isClass ? classOrPojo : CliCommand.extend(classOrPojo)
    const cachedMetadata = CliClassMetadata.fromMetadataPojo(
      metadata ?? await (await CliClassMetadata.fromClass(tool)).toPojo()
    )
    const info = CliCommandInfo.fromMetadata(cachedMetadata)
    return new CliRuntime(tool, info)
  }

  #tool // CliCommand
  #info // CliCommandInfo

  constructor(tool, info) {
    this.#tool = tool
    this.#info = info
  }

  get tool() { return this.#tool }
  get info() { return this.#info }

  async execute(path, argv) {
    const command = await this.#tool.getRuntimeCommand(...path)
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
}

export class CliTool extends CliServiceProvider {
  static { this.initialize() }

  constructor(options) {
    if (CliTool.initializing(new.target))
      return super()
    super(options)
  }

  async activate(runtime) { return runtime }
}
