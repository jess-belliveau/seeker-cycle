import type { TrainerReading } from './types'

type ReadingCB = (r: TrainerReading) => void

const subs = new Set<ReadingCB>()

export function onDemoReading(cb: ReadingCB): () => void {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

export function emitDemoReading(r: TrainerReading): void {
  subs.forEach((cb) => cb(r))
}
