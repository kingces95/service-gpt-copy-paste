import { CliTerminal } from '@kingjs/cli-terminal'
import { CliConsoleIn } from '@kingjs/cli-console'
import { AbortError } from '@kingjs/abort-error'
import ora from 'ora'
import process from 'process'

const CPU_HOT = 80
const MEM_HOT = 90

const NORMAL_INTERVAL = 100
const HOT_INTERVAL = 50

const DOTS_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const DOTS2_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']

const INIT_COLOR = 'gray'
const NORMAL_COLOR = 'cyan'
const WARN_COLOR = 'yellow'

export default class CliOrb extends CliTerminal {
  static description = 'Tool for rendering status to tty'
  static parameters = {
    cpuHot: 'Threshold for high CPU usage',
    memHot: 'Threshold for high memory usage',
  }
  static { this.initialize(import.meta) }

  constructor({ cpuHot = CPU_HOT, memHot = MEM_HOT, ...rest } = { }) {
    if (CliOrb.initializing(new.target, { cpuHot, memHot }))
      return super()
    super(rest)

    this.cpuHot = cpuHot
    this.memHot = memHot
    this.stats = { in: 0, out: 0, error: 0 }
    this.message = ''
    
    // Initialize spinner for TTY
    // this.start()
  }

  formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'm'
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k'
    return num.toString()
  }

  async run($) {
    this.spinner = ora({ spinner: { 
      interval: NORMAL_INTERVAL, 
      frames: DOTS_FRAMES
    }, color: INIT_COLOR}).start()

    while (true) {
      try {
        const { type, rest } = await $.readRecord(['type', 'rest'])
        if (!type) break

        switch (type) {
          case 'data':
            this.stats = await $.readRecord({ 
              inCount: '#', outCount: '#', errorCount: '#', cpu: '#', memory: '#' 
            })(rest)

            this.adjustSpinner(this.stats.cpu, this.stats.memory)
            this.spinner.text = this.toString()
            break

          case 'exiting':
            const { code } = await $.readRecord({ code: '#' })(rest)
            process.exitCode = code
            break

          case 'succeeded':
          case 'failed':
          case 'aborted':
          case 'errored':
            this.message = rest

            this.stats.cpu = 0
            this.stats.memory = 0

            if (type === 'succeeded') {
              if (this.stats.errorCount) {
                this.spinner.warn(this.toString())
              } else {
                this.spinner.succeed(this.toString())
              }
            } else {
              this.spinner.fail(this.toString())
            }
            return
          
          case 'starting':
            this.message = rest
            this.spinner.color = INIT_COLOR
            break

          case 'warning':
            const { _, warnMessage } 
              = await $.readRecord(['warnType', 'warnMessage'])
            this.message = `${warnMessage}`
            this.spinner.color = WARN_COLOR
            break

          default:
            this.message = rest
            this.spinner.color = NORMAL_COLOR  

          this.spinner.text = this.toString()
        }

      } catch (err) {
        if (err instanceof AbortError) continue
        console.error(err)
        this.spinner.fail(`CliOrb caught: ${err.message}`)
        break
      }
    }
  }

  adjustSpinner(cpu, memory) {
    this.spinner.spinner = {
      interval: cpu < this.cpuHot ? NORMAL_INTERVAL : HOT_INTERVAL,
      frames: memory < this.memHot ? DOTS_FRAMES : DOTS2_FRAMES
    }
  }

  toString() {
    const { inCount, outCount, errorCount, cpu, memory } = this.stats
    const parts = []

    parts.push(this.message, ' ')

    if (inCount || outCount) {
      if (inCount) {
        parts.push(this.formatNumber(inCount))
      }
  
      parts.push('>')
      
      if (outCount) {
        parts.push(this.formatNumber(outCount))
      }
    }
     
    if (errorCount) {
      parts.push('!', this.formatNumber(errorCount))
    }

    return parts.join('')
  }
}

// CliOrb.__dumpMetadata()
