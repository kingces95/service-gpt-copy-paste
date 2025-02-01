import { Cli } from '@kingjs/cli'
import { AbortError } from '@kingjs/abort-error'
import ora from 'ora'

export default class CliOrb extends Cli {
  static metadata = Object.freeze({
    name: 'orb',
    description: 'Tool for rendering status to tty',
    options: { }
  })
  
  constructor(options) {
    super(options)

    this.stats = { in: 0, out: 0, error: 0 }
    this.message = ''
    
    // Initialize spinner for TTY
    this.start()
    
    process.once('SIGINT', () => {
      // keep spinning so long as the upstream process is running
      // but only once, so a second break will kill this orb task
    })
  }

  formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'm';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return num.toString();
  }

  async start() {
    this.spinner = ora({ 
      spinner: 'dots', 
    }).start();

    while (true) {
      try {
        const record = await this.readRecord(['type', 'rest'])
        if (!record) 
          break

        const { type, rest } = record

        if (type == 'data') {
          this.stats = await Cli.readRecord(
            rest, { inCount: '#', outCount: '#', errorCount: '#' }) 
          this.spinner.text = this.toString()
          continue
        }

        if (type == 'exiting') {
          const { code } = await Cli.readRecord(rest, { code: '#' })
          process.exitCode = code
          continue
        }

        if (['succeeded', 'failed', 'aborted', 'errored'].includes(type)) {
          this.message = rest

          if (type === 'succeeded') {
            this.spinner.succeed(this.toString())
          } else {
            this.spinner.fail(this.toString())
          }
          break
        } 
        
        this.message = rest
        this.spinner.text = this.toString()
      } catch (err) {
        // ignore interrupt and instead wait for a 
        // (1) finish status or (2) stdin closure.
        if (err instanceof AbortError)
          continue
        
        console.error(err)
        this.spinner.fail(`CliOrb caught: ${err.message}`)
        break
      }
    }
  }

  toString() {
    const { inCount, outCount, errorCount } = this.stats;
    const parts = [this.message];
    const statsParts = [];

    if (inCount || outCount) {
      if (inCount) {
        statsParts.push(this.formatNumber(inCount));
      }
  
      statsParts.push('>');
      
      if (outCount) {
        statsParts.push(this.formatNumber(outCount));
      }
    }
     
    if (errorCount) {
      statsParts.push('!', this.formatNumber(errorCount));
    }

    if (statsParts.length) {
      parts.push(' ','(', ...statsParts, ')');
    }

    return parts.join('');
  }
}
