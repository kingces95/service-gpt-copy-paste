import { Cli } from '@kingjs/cli'
import { NodeName } from '@kingjs/node-name'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { CliYargsCommand } from '@kingjs/cli-yargs'
import { dumpPojo } from '@kingjs/pojo-dump'

const raw = {
  description: 'Dump Cli.getOwnMetadata()',
  parameters: { hierarchy: 'Walk and dump base classes, too.' },
  defaults: { hierarchy: false },
  handler: async function() {
    const { hierarchy } = this.options
    const class$ = await this.getClass()
    const pojo = !hierarchy ? class$.getOwnMetadata() 
      : [...class$.hierarchy()].map(o => o.getOwnMetadata())
    dumpPojo(pojo)
  }
}
const md = {
  description: `Dump ${CliClassMetadata.name}`,
  parameters: { cached: 'Save and load metadata.' },
  defaults: { cached: false },
  handler: async function() {
    const { cached } = this.options
    if (cached) {
      const metadata = await this.getCachedMetadata()
      await metadata.__dump()
      return
    }

    const metadata = await this.getMetadata()
    await metadata.__dump()
  }
}
const info = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const info = await this.getInfo()
    await info.__dump()
  }
}
const yargs = {
  description: `Dump ${CliYargsCommand.name}`,
  handler: async function(module, path) {
    const yargs = await this.getYargs()
    await yargs.__dump()
  }
}
const ls = {
  description: 'List commands',
  handler: async function() {
    const info = await this.getInfo()
    for await (const command of info.commands())
      this.write(command.path)
  }
}
const find = {
  description: 'Find commands',
  handler: async function() {
    const walk = async (info) => {
      this.write(info.path)
      for await (const child of info.commands())
        await walk(child)
    }

    walk(await this.getInfo())
  }
}

class CliReflect extends Cli {
  static description = 'Reflect on command metadata'
  static parameters = {
    module: 'Name of module',
    path: 'Path of command',
  }
  static commands = { 
    ls, find,
    raw,
    md,
    info,
    yargs
  }
  static defaults = CliReflect.loadDefaults()

  #module
  #path
  #nodeName
  #options

  constructor(module, path = [], options = {}) {
    if (CliReflect.loadingDefaults(new.target, module, path, options))
      return super()

    super(options)

    this.#module = module
    this.#path = path
    this.#options = options
    this.#nodeName = NodeName.from(module)
  }

  get module() { return this.#module }
  get path() { return this.#path }
  get nodeName() { return this.#nodeName }
  get options() { return this.#options }

  async getScope() { 
    return await this.nodeName.importObject() 
  }
  async getClass() { 
    const scope = await this.getScope()
    return await scope.getCommand(this.#path)
  }
  async getMetadata() { 
    const class$ = await this.getClass()
    return await CliClassMetadata.fromClass(class$)
  }
  async getCachedMetadata() { 
    const metadata = await this.getMetadata()
    return await CliClassMetadata.fromPojo(await metadata.toPojo())
  }
  async getInfo() {
    const metadata = await this.getMetadata()
    return CliCommandInfo.from(metadata)
  }
  async getYargs() {
    const info = await this.getInfo()
    return new CliYargsCommand(await info.toPojo())
  }
}

export const CliTool = Cli.extend({
  name: 'Cli',
  description: 'My funky cli packaging tool',
  commands: {
    curl: '@kingjs/cli-http',
    spy: CliReflect,
  }
})

export default CliTool
