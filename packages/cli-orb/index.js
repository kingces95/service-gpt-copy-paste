import { Cli } from '@kingjs/cli'
import ora from 'ora'

export default class CliOrb extends Cli {
  static metadata = Object.freeze({
    name: 'orb',
    description: 'Tool for rendering status to tty',
    options: { }
  })
  
  constructor(options) {
    super(options)

    // Initialize spinner for TTY
    this.start()
    
    process.on('SIGINT', () => {
      // keep spinning so long as the upstream process is running
    })
  }

  async start() {
    this.spinner = ora({ 
      spinner: 'dots', 
    }).start();

    try {
      while (true) {
        const record = await this.readRecord(['type', 'message'])
        if (!record) 
          break

        const { type, message } = record

        if (['succeeded', 'failed', 'aborted', 'errored'].includes(type)) {

          if (type === 'succeeded') {
            this.spinner.succeed(message)
          } else {
            this.spinner.fail(message)
          }
          break
        } 
        
        if (this.spinner.text != message) {
          this.spinner.text = message
        }
      }
    } catch (err) {
      this.spinner.fail(`Stream error: ${err.message}`)

    } finally {
      this.spinner.stop()
    }
  }
}
