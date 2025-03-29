import { CliOutputService } from './index.js'
import { createTable } from '@tanstack/table-core'

const COLUMN_SPACING = 2

export default class CliOutputAzTableService extends CliOutputService {
  static { this.initialize(import.meta) }

  constructor(options = { }) {
    if (CliOutputAzTableService.initializing(new.target)) {
      return super()
    }
    super(options)
  }

  // Function to normalize values for output (handle null, boolean, etc.)
  normalizeValue(value) {
    if (value === null || value === undefined) return ""
    if (typeof value === 'boolean') return value ? "true" : "false"
    return String(value)
  }

  async write(pojo = { }) {
    let headers = []
    let rows = []
    
    // Extract headers from the first row and collect all row values
    this.forEach(pojo, row => {
      if (headers.length === 0) {
        headers = Object.keys(row)
      }
      rows.push(headers.map(header => this.normalizeValue(row[header])))
    })
    
    // Define column widths based on the longest value per column
    const columnWidths = headers.map((header, colIndex) => 
      Math.max(header.length, ...rows.map(row => row[colIndex].length))
    )
    
    const spacing = " ".repeat(COLUMN_SPACING)
    
    // Print table headers with fixed width
    headers.forEach((header, index) => {
      this.stdout.write(header.padEnd(columnWidths[index]))
      if (index < headers.length - 1) this.stdout.write(spacing)
    })
    this.stdout.write("\n")
    
    // Print dashed line under headers with fixed width
    headers.forEach((header, index) => {
      this.stdout.write("-".repeat(columnWidths[index]))
      if (index < headers.length - 1) this.stdout.write(spacing)
    })
    this.stdout.write("\n")
    
    // Print table rows with fixed column width
    rows.forEach(row => {
      row.forEach((value, index) => {
        this.stdout.write(value.padEnd(columnWidths[index]))
        if (index < row.length - 1) this.stdout.write(spacing)
      })
      this.stdout.write("\n")
    })
  }
}