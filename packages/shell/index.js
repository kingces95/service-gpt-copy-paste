import { spawn } from 'child_process'
import { PassThrough, Readable } from 'stream'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

const mkdtemp = promisify(fs.mkdtemp)
const writeFile = promisify(fs.writeFile)
const rm = promisify(fs.rm)

export class Command {
  #launch

  constructor(launch) {
    this.#launch = launch
  }

  async launch({ 
    stdin, 
    stdout = process.stdout, 
    stderr = process.stderr 
  } = { }) {
    return this.#launch({ stdin, stdout, stderr })
  }

  pipe(...nextCommands) {
    return nextCommands.reduce((prev, next) => {
      return new Command(async ({ stdin, stdout, stderr }) => {
        const middle = new PassThrough()
        await Promise.all([
          prev.launch({ stdin, stdout: middle, stderr }),
          next.launch({ stdin: middle, stdout, stderr })
        ])
      })
    }, this)
  }

  async asFilePath({ keep = false } = {}) {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cmd-'))
    const tmpFile = path.join(tmpDir, 'out.txt')
    const stream = fs.createWriteStream(tmpFile)
    await this.launch({ stdout: stream })
    return keep ? tmpFile : tmpFile
  }

  async withFilePath(fn) {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cmd-'))
    const tmpFile = path.join(tmpDir, 'out.txt')
    const stream = fs.createWriteStream(tmpFile)
    await this.launch({ stdout: stream })
    try {
      return await fn(tmpFile)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  }
}

function parseCommand(strings, values) {
  const result = []

  for (let i = 0; i < strings.length; i++) {
    const raw = strings[i].trim()
    if (raw.length > 0)
      result.push(...raw.split(/\s+/))

    if (i < values.length) {
      const value = values[i]

      if (Array.isArray(value)) {
        for (const element of value) {
          result.push(String(element))
        }
      } else {
        result.push(String(value))
      }
    }
  }

  return result
}

export class Shell {
  static bind({ signal } = {}) {
    return new Shell({ signal }).bind()
  } 

  constructor({ signal } = {}) {
    this.signal = signal
  }

  fromSpawn(command, args = [], options = {}) {
    const shell = options.shell ?? false
    const opts = {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell,
      signal: this.signal,
      ...options
    }
    delete opts.shell

    return new Command(async ({ stdin, stdout, stderr }) => {
      const child = spawn(command, args, opts)
      if (stdin) stdin.pipe(child.stdin)
      if (stdout) child.stdout.pipe(stdout)
      if (stderr) child.stderr.pipe(stderr)
      return new Promise((resolve, reject) => {
        child.on('error', reject)
        child.on('exit', code => {
          code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))
        })
      })
    })
  }

  fromString(str) {
    return new Command(async ({ stdout }) => {
      Readable.from([str]).pipe(stdout)
    })
  }

  fromLines(...lines) {
    return this.fromString(lines.join('\n') + '\n')
  }

  fromFile(filePath) {
    return new Command(async ({ stdout }) => {
      fs.createReadStream(filePath).pipe(stdout)
    })
  }

  sequence(...commands) {
    return new Command(async (streams) => {
      for (const command of commands) {
        await command.launch(streams)
      }
    })
  }

  pipeline(...commands) {
    return commands[0].pipe(...commands.slice(1))
  }

  spawn(strings, ...values) {
    const [cmd, ...args] = parseCommand(strings, values)
    return this.fromSpawn(cmd, args)
  }

  node(strings, ...values) {
    const [cmd, ...args] = parseCommand(strings, values)
    return this.fromSpawn(process.argv[0], [cmd, ...args])
  }

  self(strings, ...values) {
    const args = parseCommand(strings, values)
    return this.fromSpawn(process.argv[0], [process.argv[1], ...args])
  }

  bash(strings, ...values) {
    const [cmd, ...args] = parseCommand(strings, values)
    return this.fromSpawn(cmd, args, { shell: 'bash' })
  }

  cmd(strings, ...values) {
    const [cmd, ...args] = parseCommand(strings, values)
    return this.fromSpawn(cmd, args, { shell: 'cmd.exe' })
  }

  wsl(strings, ...values) {
    const [cmd, ...args] = parseCommand(strings, values)
    return this.fromSpawn(cmd, args, { shell: 'wsl' })
  }

  sh(strings, ...values) {
    const [cmd, ...args] = parseCommand(strings, values)
    return this.fromSpawn(cmd, args, { shell: '/bin/sh' })
  }

  bind() {
    return {
      // Command Execution
      $: this.self.bind(this),                // await self$`--help`.launch()
      spawn_$: this.spawn.bind(this),         // await $`ls`.launch()
      node_$: this.node.bind(this),           // await node$`-v`.launch()

      // Shell-Wrapped Commands
      bash_$: this.bash.bind(this),           // await bash$`echo hello`.launch()
      cmd_$: this.cmd.bind(this),             // await cmd$`echo hello`.launch()
      wsl_$: this.wsl.bind(this),             // await wsl$`echo hello`.launch()
      sh_$: this.sh.bind(this),               // await sh$`echo hello`.launch()

      // Combinators
      pipeline_$: this.pipeline.bind(this),   // await pipeline$(cmd1, cmd2).launch()
      sequence_$: this.sequence.bind(this),   // await sequence$(cmd1, cmd2).launch()

      // Literals
      file_$: this.fromFile.bind(this),       // await file$('path.txt').launch()
      lines_$: this.fromLines.bind(this),     // await lines$('a', 'b').launch()
      line_$: this.fromString.bind(this),     // await line$('hi').launch()
      cat_$: this.fromString.bind(this)       // await cat$('hi').launch()
    }
  }
}
