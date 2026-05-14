import { useEffect, useRef } from 'react'

export function useGameLoop(active: boolean, onTick: (deltaMs: number) => void): void {
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (!active) {
      lastTimeRef.current = 0
      return
    }

    const tick = (time: number): void => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 0
      lastTimeRef.current = time
      onTickRef.current(Math.min(delta, 100))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = 0
    }
  }, [active])
}
