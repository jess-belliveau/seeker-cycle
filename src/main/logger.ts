let verbose = false

export function setVerbose(enabled: boolean): void {
  verbose = enabled
  console.log(`[DEBUG] verbose logging ${enabled ? 'ON' : 'OFF'}`)
}

export function log(...args: unknown[]): void {
  if (verbose) console.log(...args)
}

export function warn(...args: unknown[]): void {
  if (verbose) console.warn(...args)
}
