import { assert } from "@kingjs/assert"
import { trimPojo } from "@kingjs/pojo-trim"

function pivotPojo(pojoRow, pivotsMd, pivot) {

  for (const key of Reflect.ownKeys(pivotsMd)) {
    const pivotMd = pivotsMd[key]
    const { predicate, type } = pivotMd
    if (predicate) {
      if (!pojoRow[predicate]) continue
      delete pojoRow[predicate]
    }
    if (type) {
      if (pojoRow.type != type) continue
      // delete pojo.type
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
        pivotPojo({ ...pojoRow }, copyPivotMd, copyPivot)
      }
      return
    }

    // base case
    if (!('pivot' in pivotMd)) {
      const { name } = pojoRow
      nextPivot[name] = pojoRow
      delete pojoRow.name
      return
    }

    // recursive case
    return pivotPojo(pojoRow, pivotMd.pivot, nextPivot)
  }
}

function pivotSkeleton(pivotsMd, pivot = { }) {
  for (const key of Reflect.ownKeys(pivotsMd)) {
    const pivotMd = pivotsMd[key]
    const subPivot = pivot[key] = { }

    const subPivotMd = pivotMd.pivot
    if (subPivotMd)
      pivotSkeleton(subPivotMd, subPivot)
  }
  return pivot
}

export function pivotPojos(pojoRows, metadata) {
  const pivot = pivotSkeleton(metadata)
  for (const pojoRow of pojoRows)
    pivotPojo({ ...pojoRow }, metadata, pivot)
  return trimPojo(pivot)
}