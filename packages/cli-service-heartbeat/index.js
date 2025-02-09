#!/usr/bin/env node
import os from 'os'

export class CliServiceHeartbeat {
  constructor({ intervalMs = 100, reportMs = 1000 } = {}) {
    this.heartbeat = false
    this.intervalMs = intervalMs
    this.reportMs = reportMs
  }

  async start$(callback) {
    let ms = 0
    let prevCPU = process.cpuUsage()
    this.heartbeat = true
    
    while (this.heartbeat) {
      await new Promise(resolve => setTimeout(resolve, this.intervalMs))
      ms += this.intervalMs
      if (ms < this.reportMs) 
        continue
      
      const cpuUsage = process.cpuUsage(prevCPU)
      prevCPU = process.cpuUsage()
      
      const userCPU = cpuUsage.user / 1e6
      const systemCPU = cpuUsage.system / 1e6
      const totalCPU = ((userCPU + systemCPU) / (ms / 1000) / os.cpus().length) * 100

      const memoryUsage = (process.memoryUsage().rss / os.totalmem() * 100).toFixed(1)
      
      callback(totalCPU.toFixed(1), memoryUsage)
      ms = 0
    }
  }

  async stop$() {
    this.heartbeat = false
  }
}
