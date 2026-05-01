import { 
  Attachments, 
  AbstractAttachments 
} from '@kingjs/partial-attachments'
import { copyTo } from '@kingjs/partial-reflect'
import { From } from '@kingjs/partial-symbols'

export function define(type, ...definitions) {
  for (const definition of definitions) {
    const partialType = Attachments[From](definition)
    copyTo(partialType, type)
  }
}

export function defineAbstract(type, ...definitions) {
  for (const definition of definitions) {
    const partialType = AbstractAttachments[From](definition)
    copyTo(partialType, type)
  }
}