export function normalizeUUID(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase()
}

export function readUInt16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset)
}

export function readInt16LE(buf: Buffer, offset: number): number {
  return buf.readInt16LE(offset)
}

export function readUInt32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset)
}

export function hasBit(flags: number, bit: number): boolean {
  return (flags & (1 << bit)) !== 0
}
