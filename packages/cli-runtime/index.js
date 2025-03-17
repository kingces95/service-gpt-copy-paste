import { CliCommand } from '@kingjs/cli-command'
import { interval } from 'rxjs'
import { tap } from 'rxjs/operators'
import ora from 'ora'
import util from "util"

export default class CliRuntime {
  
  static entrypoint(ctor, argv) {
    const abortController = new AbortController()
    const signal = abortController.signal
    const cli = new ctor({ ...argv, signal })

    const abort = () => abortController.abort()
    process.on('SIGINT', abort)
    cli.on('close', () => process.off('SIGINT', abort))

    process.stdin.pipe(cli.stdin)
    
    if (process.stdout.isTTY) {
      new CliRuntime(cli)
    } else {
      cli.stdout.pipe(process.stdout)
      cli.stderr.pipe(process.stderr)
    }

    cli.on('close', (result) => process.exit(result ? 1 : 0))
  }

  constructor(cli) {
    this.cli = cli
    this.spinner = ora({ spinner: 'dots' }).start()
    this.bytes = { in: 0, out: 0, error: 0 }
    this.status = { state: 'starting', result: null }

    cli.stdin.on('data', (chunk) => (this.bytes.in += chunk.length))
    cli.stdout.on('data', (chunk) => (this.bytes.out += chunk.length))
    cli.stderr.on('data', (chunk) => (this.bytes.error += chunk.length))

    cli.on('status', (state, ...result) => {
      if (this.cli.verbose 
        && !CliCommand.isFinished(this.status.state) 
        && state != this.status.state) {
        this.spinner.info(this.toHeadline())
        this.spinner.start()
      }

      this.status.state = state
      this.status.result = result
    })

    this.subscription = interval(200).pipe(
      tap(() => {
        const headline = this.toHeadline()
        if (headline != this.spinner.text)
          this.spinner.text = headline
      })  
    ).subscribe()  

    cli.on('exit', () => {
      const headline = this.toHeadline()

      if (this.isSuccess()) {
        this.spinner.succeed(headline)
      } else {
        this.spinner.fail(headline)
      }
    })
    
    cli.on('close', () => {
      this.subscription.unsubscribe()
    })

    cli.on('error', (err) => {
      const headline = this.toHeadline()

      this.spinner.fail(headline)
      if (err instanceof Error)
        console.log(util.inspect(err))

      this.subscription.unsubscribe()
    })
  }

  isSuccess() {
    const { state, result } = this.status
    return CliCommand.isSuccess(state, ...result)
  }

  toHeadline() {
    const { in: inBytes, out: outBytes, error: errorBytes } = this.bytes
    const { state, result } = this.status
    const headline = this.cli.toString(state, ...(result || []))
    return headline
  }
}
