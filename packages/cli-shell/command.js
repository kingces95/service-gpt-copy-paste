export class Command {
  #launch

  constructor(launch) {
    this.#launch = launch
  }

  async run(redirections = {}) {
    const { stdin, stdout, stderr } = await mapRedirections(redirections)
    return this.#launch({ stdin, stdout, stderr })
  }

  pipe(...nextCommands) {
    return nextCommands.reduce((prev, next) => {
      return new Command(async ({ stdin, stdout, stderr }) => {
        const middle = new PassThrough()
        await Promise.all([
          prev.run({ stdout: middle, stderr }),
          next.run({ stdin: middle, stdout, stderr })
        ])
      })
    }, this)
  }

  async asFilePath({ keep = false } = {}) {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cmd-'))
    const tmpFile = path.join(tmpDir, 'out.txt')
    const stream = fs.createWriteStream(tmpFile)
    await this.run({ stdout: stream })
    return keep ? tmpFile : tmpFile
  }

  async withFilePath(fn) {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cmd-'))
    const tmpFile = path.join(tmpDir, 'out.txt')
    const stream = fs.createWriteStream(tmpFile)
    await this.run({ stdout: stream })
    try {
      return await fn(tmpFile)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  }
}