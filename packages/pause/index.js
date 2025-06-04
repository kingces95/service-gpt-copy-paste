import { sleep } from '@kingjs/sleep'

export const PAUSE_MS = 250

export function pause() {
  return sleep(PAUSE_MS)
} 
