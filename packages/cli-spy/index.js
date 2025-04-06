import { CliCommand } from '@kingjs/cli-command'
import { CliConsoleOut } from '@kingjs/cli-console'
import { CliOutputService } from '@kingjs/cli-output-service'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { CliYargsCommand } from '@kingjs/cli-yargs'

const raw = {
  description: 'Dump Cli.ownMetadata',
  handler: async function() {
    const command = await this.getCommand()
    const pojo = [...command.hierarchy()].map(o => o.ownMetadata)
    await this.log(pojo)
  }
}
const md = {
  description: `Dump ${CliClassMetadata.name}`,
  handler: async function() {
    const metadata = await this.getMetadata()
    await this.log(await metadata.toPojo())
  }
}
const cachedMd = {
  description: `Dump cached ${CliClassMetadata.name}`,
  handler: async function() {
    const metadata = await this.getCachedMetadata()
    await this.log(await metadata.toPojo())
  }
}
const mdParams = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const md = await this.getMetadata()
    for await (const classMd of md.classes()) {
      for await (const paramMd of classMd.parameters())
        await this.log.echoRecord([paramMd.name, classMd.name])
    }
  }
}
const json = {
  description: `Dump ${CliClassMetadata.name}.toPojo()`,
  handler: async function() {
    const metadata = await this.getCachedMetadata()
    await this.log(await metadata.toPojo())
  }
}
const info = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const info = await this.getInfo()
    await this.log(await info.toPojo())
  }
}
const params = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const info = await this.getInfo()
    const dumpParams = async (info) => {
      for await (const parameter of info.parameters())
        await this.log.echoRecord([info.name, parameter.name])
      for await (const command of info.commands())
        await dumpParams(command)
    }
    await dumpParams(info)
  }
}
const yargs = {
  description: `Dump ${CliYargsCommand.name}`,
  handler: async function() {
    const yargs = await this.getYargs()
    await this.log(await yargs.toPojo())
  }
}
const ls = {
  description: 'List commands',
  handler: async function() {
    const info = await this.getInfo()
    for await (const command of info.commands())
      await this.write(command.path)
  }
}
const find = {
  description: 'Find commands',
  handler: async function() {
    const walk = async (info) => {
      await this.write(info.path)
      for await (const child of info.commands())
        await walk(child)
    }

    walk(await this.getInfo())
  }
}

export class CliSpy extends CliCommand {
  static description = 'Reflect on command metadata'
  static parameters = {
    path: 'Path of command',
  }
  static services = {
    outputService: CliOutputService, 
    console: CliConsoleOut
  }
  static commands = { 
    ls, find,
    raw, md, cachedMd, json,
    info, yargs, params, mdParams
  }
  static { this.initialize(import.meta) }

  #path
  #console
  #outputService

  constructor(path = [], options = {}) {
    if (CliSpy.initializing(new.target, path, options))
      return super()
    super(options)

    const { console, outputService } = this.getServices(CliSpy, options)
    this.#console = console
    this.#outputService = outputService
    this.#path = path
  }

  get path() { return this.#path }

  async getCommand() { 
    const { runtime } = this.info
    const { class: class$ } = await runtime.getCommandInfo(this.#path)
    return class$
  }
  async getMetadata() { 
    const command = await this.getCommand()
    return await CliClassMetadata.fromClass(command)
  }
  async getCachedMetadata() { 
    const metadata = await this.getMetadata()
    return await CliClassMetadata.fromMetadataPojo(await metadata.toPojo())
  }
  async getInfo() {
    const metadata = await this.getCachedMetadata()
    return CliCommandInfo.fromMetadata(metadata)
  }
  async getYargs() {
    const info = await this.getInfo()
    return CliYargsCommand.fromInfoPojo(await info.toPojo())
  }
  
  async write(string) {
    await this.#console.echo(string)
  }
  async log(pojo) {
    await (await this.#outputService).write(pojo)
  }
}

