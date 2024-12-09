// Import required modules
import ora from 'ora'
import { interval } from 'rxjs'

export default class Terminal {
  constructor() {
    this.spinner = ora()
    this.outputCount = 0
    this.errorCount = 0
    this.state = ''
    this.spinner.color = 'gray'
    this.spinner.start()
  }

  static formatCharLabel(value) {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}m`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}k`
    }
    return value.toString()
  }

  formatHeadline() {
    const outputCountFormatted = Terminal.formatCharLabel(this.outputCount)
    const errorCountFormatted = Terminal.formatCharLabel(this.errorCount)
    let charCountFormatted = ''
    if (this.outputCount > 0 || this.errorCount > 0)
      charCountFormatted = `(${outputCountFormatted}/${errorCountFormatted})`
    if (this.errorCount)
      this.spinner.color = 'yellow'
    return [this.state, charCountFormatted].filter(Boolean).join(' ')
  }

  renderUpdate({ outputCount, errorCount, state = '' }) {
    if (outputCount !== undefined) {
      this.outputCount = outputCount
    }
    if (errorCount !== undefined) {
      this.errorCount = errorCount
    }
    if (state) {
      this.state = state
    }
    this.spinner.text = this.formatHeadline(this.state)
  }

  renderInterrupt(state) {
    this.renderUpdate({ state })
  }

  renderStart(state) {
    this.spinner.color = 'blue'
    this.renderUpdate({ state })
  }

  renderSuccess(state) {
    this.spinner.succeed(this.renderUpdate({ state }))
  }

  renderWarning(state) {
    this.spinner.warn(this.renderUpdate({ state }))
  }

  renderFailure(state) {
    this.spinner.fail(this.renderUpdate({ state }))
  }
}
