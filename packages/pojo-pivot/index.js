import { assert } from "@kingjs/assert"
import { trimPojo } from "@kingjs/pojo-trim"

function pivotPojo(pojoRow, pivotsMd, pivot, context) {

  for (const key of Reflect.ownKeys(pivotsMd)) {
    const pivotMd = pivotsMd[key]
    const { predicate, discriminatorKey = 'type', discriminator } = pivotMd
    if (predicate) {
      if (!pojoRow[predicate]) continue
      delete pojoRow[predicate]
    }
    if (discriminator) {
      if (pojoRow[discriminatorKey] != discriminator) continue
      delete pojoRow[discriminatorKey]
    }
    
    // pivotSkeleton ensures this exists
    const nextPivot = pivot[key]
    assert(nextPivot, `Pivot key ${String(key)} missing.`)

    if ('copyPivot' in pivotMd) {
      const [ pojoRowKey, copyPivotMd ] = pivotMd.copyPivot
      const copyPivotKeys = pojoRow[pojoRowKey] || []
      delete pojoRow[pojoRowKey]
      for (const copyPivotKey of copyPivotKeys) {
        if (!(copyPivotKey in nextPivot))
          nextPivot[copyPivotKey] = pivotSkeleton(copyPivotMd)
        const copyPivot = nextPivot[copyPivotKey]
        pivotPojo({ ...pojoRow }, copyPivotMd, copyPivot, context)
      }
      return
    }

    // base case
    if (!('pivot' in pivotMd)) {
      const { map, type } = pivotMd
      
      if (map) pojoRow = map(pojoRow, context)

      if (type == 'array') {
        nextPivot.push(pojoRow)
        return
      }

      const { name } = pojoRow
      nextPivot[name] = pojoRow
      delete pojoRow.name
      return
    }

    // recursive case
    return pivotPojo(pojoRow, pivotMd.pivot, nextPivot, context)
  }
}

function pivotSkeleton(pivotsMd, pivot = { }) {
  for (const key of Reflect.ownKeys(pivotsMd)) {
    const pivotMd = pivotsMd[key]

    if (pivotMd.type == 'array') {
      pivot[key] = [ ]
      continue
    }

    const subPivot = pivot[key] = { }
    const subPivotMd = pivotMd.pivot
    if (subPivotMd)
      pivotSkeleton(subPivotMd, subPivot)
  }
  return pivot
}

export function pivotPojos(pojoRows, metadata, context) {
  const pivot = pivotSkeleton(metadata)
  for (const pojoRow of pojoRows)
    pivotPojo({ ...pojoRow }, metadata, pivot, context)
  return trimPojo(pivot)
}