import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragonMotionState } from './DragonMotion'

const SEQUENCES = {
  wish: [
    ['wish', 2600],
    ['complete', 1700],
    ['idle', 0],
  ],
  burn: [
    ['listening', 900],
    ['burn', 3900],
    ['complete', 1700],
    ['idle', 0],
  ],
} satisfies Record<string, [DragonMotionState, number][]>

export function useDragonMotion(initial: DragonMotionState = 'idle') {
  const [state, setState] = useState<DragonMotionState>(initial)
  const timers = useRef<number[]>([])

  const stop = useCallback(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => stop, [stop])

  const play = useCallback((name: keyof typeof SEQUENCES) => {
    stop()
    let elapsed = 0
    SEQUENCES[name].forEach(([nextState, duration]) => {
      timers.current.push(window.setTimeout(() => setState(nextState), elapsed))
      elapsed += duration
    })
  }, [stop])

  const reset = useCallback(() => {
    stop()
    setState('idle')
  }, [stop])

  return {
    state,
    setState,
    playWish: () => play('wish'),
    playBurn: () => play('burn'),
    reset,
  }
}
