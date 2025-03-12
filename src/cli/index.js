import { cliYargs } from '@kingjs/cli-yargs'
import { NodeName } from '@kingjs/node-name'
import { CliMetadataLoader } from '@kingjs/cli-metadata'
import { CliInfoLoader } from '@kingjs/cli-info'
import { dumpPojo } from '@kingjs/pojo-dump'
import { hideBin } from 'yargs/helpers'

const REQUIRED = undefined

const metadata = {
  description: 'Dump metadata tables',
  handler: function(module) {
    const className = NodeName.from(module)
    className.importObject()
      .then(type => CliMetadataLoader.load(type).toPojo())
      .then(metadata => dumpPojo(metadata))
  }
}

const info = {
  description: 'Dump metadata info',
  handler: function(module) {
    const className = NodeName.from(module)
    className.importObject()
      .then(type => CliMetadataLoader.load(type).toPojo())
      .then(metadata => new CliInfoLoader(metadata).toPojo())
      .then(info => dumpPojo(info))
  }
}

cliYargs({
  name: 'CliTool',
  description: 'My funky cli packaging tool',
  commands: {
    reflect: {
      parameters: {
        module: 'Name of module',
        name: 'Name of command',
      },
      defaults: [REQUIRED, null, { }],
      description: 'Reflect on command metadata',
      commands: {
        metadata,
        info
      }
    }
  }
}).then(async (yargs) => {
  const toolName = 'cli-tool'
  yargs = yargs
    .scriptName(toolName)
    .usage(`${toolName} <command> [options]`)
    .wrap(90)

  // const argv = await yargs.parse('--metadata$'.split(' '))
  // const argv = await yargs.parse('--info$'.split(' '))
  // const argv = await yargs.parse('reflect metadata @kingjs/cli-http --metadata$'.split(' '))
  // const argv = await yargs.parse('reflect metadata @kingjs/cli-http --infos$'.split(' '))
  // const argv = await yargs.parse('reflect metadata @kingjs/cli-http'.split(' '))
  const argv = await yargs.parse(hideBin(process.argv))

  new argv._class(...argv._positionals, argv._options)
})
