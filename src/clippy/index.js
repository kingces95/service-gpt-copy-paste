import { CliMetadataLoader } from '@kingjs/cli-metadata'
import { CliInfoLoader } from '@kingjs/cli-info'
import { cliYargs } from '@kingjs/cli-yargs'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs'

cliYargs({
  name: 'Clippy',
  description: 'My funky cli',
  commands: {
    http: '@kingjs/cli-http',
    orb: '@kingjs/cli-orb',
    poll: '@kingjs/cli-poll-clipboard',
    eval: '@kingjs/cli-eval',
  }
}).then(async (yargs) => {
  yargs = await yargs.parserConfiguration({ "strip-dashed": true })
  
  const argv = await yargs.parse('poll --metadata$'.split(' '))
  // const argv = await yargs.parse(hideBin(process.argv))

  argv._class.run(argv)
})

// node.exe src\clippy\index.js poll --error-rate .5 --poll-ms 1000 --stdis | node.exe src\clippy\index.js orb
