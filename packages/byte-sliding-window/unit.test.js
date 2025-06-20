import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { ByteSlidingWindow } from './index.js'

describe('A ByteSlidingWindow', () => {
  let window
  beforeEach(() => {
    window = new ByteSlidingWindow()
  })
  
})