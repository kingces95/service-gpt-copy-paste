import _ from 'lodash'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Cli } from '@kingjs/cli'
import { CliLoader } from '@kingjs/cli-info'
import { CliBashEval, CliCmdEval } from '@kingjs/cli-eval'
import { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } from '@kingjs/cli-http'
import CliPollClipboard from '@kingjs/cli-poll-clipboard'
import chalk from 'chalk'

 class CliYargsLoader {
  static buildCommand(member) {
    const { name } = member
    const positionals = [...member.positionals()]
    const parts = [name]

    // Add `<command>` placeholder for groups
    if (member.isGroup) {
      parts.push('<cmd>')
    }

    // Add positional arguments
    positionals.forEach(p => {
      const isOptional = p.type === 'array' || p.default !== undefined
      const part = isOptional ? `[${p.name}...]` : `<${p.name}>`
      parts.push(part)
    })

    return parts.join(' ')
  }

  static buildPositional(positional) {
    return {
      alias: positional.aliases,
      choices: positional.choices,
      coerce: positional.coerce,
      conflicts: positional.conflicts,
      default: positional.default,
      defaultDescription: positional.defaultDescription,
      describe: positional.describe,
      implies: positional.implies,
      normalize: positional.normalize,
      type: positional.type,
    }
  }

  static buildOption(option) {
    return {
      alias: option.aliases,
      choices: option.choices,
      coerce: option.coerce,
      conflicts: option.conflicts,
      default: option.default,
      defaultDescription: option.defaultDescription,
      describe: option.describe,
      implies: option.implies,
      normalize: option.normalize,
      type: option.type,

      boolean: option.boolean,
      count: option.count, 
      demandOption: option.demandOption, 
      global: option.global, 
      hidden: option.hidden, 
      number: option.number, 
      string: option.string,               
    }
  }

  static loadGroups(yargs$, info) {
    while (info) {
      for (const option of info.options()) {
        const group = ['Options']
        if (info.isGroup) {
          const name = info.name ?? 'global'
          group.push(`(${name}):`)
        } 
        yargs$.group(option.name, group.join(' '))
      }
    
      // recursion in necessary for help option group ordering
      info = info.parent
    } 
  }

  static load(yargs$, info) {

    // load positionals
    for (const positional of info.positionals()) {
      yargs$.positional(positional.name, CliYargsLoader.buildPositional(positional))
    }
    
    // load options
    for (const option of info.options()) {
      yargs$.option(option.name, CliYargsLoader.buildOption(option))
    }

    // load option groupings
    CliYargsLoader.loadGroups(yargs$, info)

    // load members
    for (const member of info.members()) {
      yargs$.command(
        CliYargsLoader.buildCommand(member),
        member.description || '<missing description>',
        (subYargs) => CliYargsLoader.load(subYargs, member),
        (argv) => CliYargsLoader.action(member, argv)
      )
    }
  }

  static action(member, argv) {
    if (!member.isCommand) {
      throw new Error('Cannot execute non-command member')
    }
    return new member.classInfo.cls$(argv)
  }

  constructor(metadata) {
    if (typeof metadata == 'function' && metadata?.prototype instanceof Cli) {
      metadata = { '*': metadata }
    }

    this.yargs$ = yargs()
      .parserConfiguration({ "camel-case-expansion": true })
      .demandCommand(1, `You need to specify a command`)

    this.info = new CliLoader(metadata)
    CliYargsLoader.load(this.yargs$, this.info)
  }

  parse(argv = hideBin(process.argv)) {
    this.yargs$.parse(argv)
  }
}

class Http extends Cli {
  static metadata = {
    options: {
      timeout: {
        alias: 't',
        type: 'integer',
        describe: 'Timeout (seconds)',
        default: 2000
      }
    },
    arguments: [
      {
        name: 'url',
        describe: 'The URL for the HTTP request',
        type: 'string',
        required: false
      }
    ],
    description: 'Group of HTTP commands'
  }
}

class HttpGet extends Http {
  constructor(argv) {
    super()
    console.log('HTTP GET Command', argv)
  }

  static metadata = {
    options: {
      headers: {
        alias: 'H',
        type: 'array',
        describe: 'Headers to include in the request',
        default: []
      }
    },
    description: 'HTTP GET request'
  }
}

class HttpPost extends Http {
  constructor(argv) {
    super()
    console.log('HTTP POST Command', argv)
  }

  static metadata = {
    options: {
      body: {
        alias: 'b',
        type: 'string',
        describe: 'The body of the POST request',
        default: ''
      },
      headers: {
        alias: 'H',
        type: 'array',
        describe: 'Headers to include in the request',
        default: []
      }
    },
    description: 'HTTP POST request'
  }
}

class PollClipboard extends Cli {
  constructor(argv) {
    super()
    console.log('Polling Clipboard Command', argv)
  }

  static metadata = {
    options: {
      myInterval: {
        alias: 'i',
        type: 'number',
        describe: 'Polling interval in milliseconds',
        default: 1000,
        group: 'Foo'
      }
    },
    description: 'Poll the clipboard for changes'
  }
}

const metadata = {
  http: {
    get: CliGet, 
    post: CliPost, 
    put: CliPut, 
    delete: CliDelete, 
    patch: CliPatch, 
    head: CliHead
  },
  http2: {
    // class$: Http,
    get: HttpGet,
    post: HttpPost
  },
  eval: {
    //description$: 'Group of shell evaluation commands',
    bash: CliBashEval,
    cmd: CliCmdEval
  },
  poll: CliPollClipboard
}

//const cli = new CliYargsLoader(CliPollClipboard)
const cli = new CliYargsLoader(metadata)
cli.parse()
