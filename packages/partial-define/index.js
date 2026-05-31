import { 
  Attachments, 
  AbstractAttachments 
} from '@kingjs/partial-attachments'
import { Normalize } from '@kingjs/partial-type'
import { copyTo } from '@kingjs/partial-reflect'

export function define(type, ...definitions) {
  for (const definition of definitions) {
    const partialType = Attachments[Normalize](definition)
    copyTo(partialType, type)
  }
}

export function defineAbstract(type, ...definitions) {
  for (const definition of definitions) {
    const partialType = AbstractAttachments[Normalize](definition)
    copyTo(partialType, type)
  }
}
