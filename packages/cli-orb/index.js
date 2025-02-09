import { Cli } from '@kingjs/cli'
import { AbortError } from '@kingjs/abort-error'
import ora from 'ora'
import os from 'os'
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

export default class CliOrb extends Cli {
  static description = 'Tool for rendering status to tty'
  static descriptions = {
    cpuHot: 'Threshold for high CPU usage',
    memHot: 'Threshold for high memory usage',
  }
  static info = CliOrb.load()
  
  constructor({ cpuHot = CPU_HOT, memHot = MEM_HOT, ...rest } = { }) {
    if (Cli.isLoading(arguments) || CliOrb.saveDefaults({ cpuHot, memHot }))
      return super(Cli.loading)

    super(rest)
    
    this.cpuHot = cpuHot
    this.memHot = memHot
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
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'm'
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k'
    return num.toString()
  }

  async start() {
    this.spinner = ora({ spinner: { 
      interval: NORMAL_INTERVAL, 
      frames: DOTS_FRAMES
    }, color: INIT_COLOR}).start()

    while (true) {
      try {
        const record = await this.readRecord(['type', 'rest'])
        if (!record) 
          break

        const { type, rest } = record

        if (type == 'data') {
          this.stats = await Cli.splitRecord(
            rest, { inCount: '#', outCount: '#', errorCount: '#', cpu: '#', memory: '#' }) 

          this.adjustSpinner(this.stats.cpu, this.stats.memory)
          this.spinner.text = this.toString()
          continue
        }

        if (type == 'exiting') {
          const { code } = await Cli.splitRecord(rest, { code: '#' })
          process.exitCode = code
          continue
        }

        if (['succeeded', 'failed', 'aborted', 'errored'].includes(type)) {
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
          break
        } 

        if (type == 'initializing') {
          this.message = rest
          this.spinner.color = INIT_COLOR

        } else if (type == 'warning') {
          const { warnType, warnMessage } = await Cli.splitRecord(rest, ['warnType', 'warnMessage'])
          this.message = warnMessage
          this.spinner.color = WARN_COLOR

        } else {
          this.message = rest
          this.spinner.color = NORMAL_COLOR
        }

        this.spinner.text = this.toString()
      } catch (err) {
        if (err instanceof AbortError)
          continue
        
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

// CliOrb.__dumpLoader()
