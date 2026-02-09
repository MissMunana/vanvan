import { useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

type SoundName = 'complete' | 'coin' | 'applause' | 'badge' | 'exchange' | 'levelup' | 'gentle'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playNoise(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  volume = 0.1,
) {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.linearRampToValueAtTime(volume * 0.8, startTime + duration * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(3000, startTime)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(startTime)
  source.stop(startTime + duration)
}

const SOUNDS: Record<SoundName, (ctx: AudioContext) => void> = {
  complete: (ctx) => {
    const now = ctx.currentTime
    playTone(ctx, 523, now, 0.15, 'sine', 0.3)
    playTone(ctx, 659, now + 0.1, 0.15, 'sine', 0.3)
    playTone(ctx, 784, now + 0.2, 0.3, 'sine', 0.25)
  },

  coin: (ctx) => {
    const now = ctx.currentTime
    playTone(ctx, 1200, now, 0.08, 'square', 0.15)
    playTone(ctx, 1600, now + 0.06, 0.12, 'square', 0.12)
  },

  applause: (ctx) => {
    const now = ctx.currentTime
    playNoise(ctx, now, 0.8, 0.12)
    playNoise(ctx, now + 0.2, 0.6, 0.08)
    playTone(ctx, 880, now + 0.1, 0.3, 'sine', 0.1)
    playTone(ctx, 1100, now + 0.3, 0.3, 'sine', 0.08)
  },

  badge: (ctx) => {
    const now = ctx.currentTime
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      playTone(ctx, freq, now + i * 0.15, 0.4, 'sine', 0.2)
      playTone(ctx, freq * 1.5, now + i * 0.15, 0.3, 'triangle', 0.1)
    })
  },

  exchange: (ctx) => {
    const now = ctx.currentTime
    playTone(ctx, 659, now, 0.12, 'sine', 0.25)
    playTone(ctx, 784, now + 0.1, 0.12, 'sine', 0.25)
    playTone(ctx, 1047, now + 0.2, 0.25, 'sine', 0.2)
  },

  levelup: (ctx) => {
    const now = ctx.currentTime
    const notes = [392, 440, 494, 523, 587]
    notes.forEach((freq, i) => {
      playTone(ctx, freq, now + i * 0.12, 0.25, 'sine', 0.2)
    })
  },

  gentle: (ctx) => {
    const now = ctx.currentTime
    playTone(ctx, 440, now, 0.4, 'sine', 0.15)
    playTone(ctx, 330, now + 0.15, 0.3, 'sine', 0.1)
  },
}

export function useSound() {
  const getCurrentChild = useAppStore((s) => s.getCurrentChild)
  const lastPlayRef = useRef<number>(0)

  const play = useCallback((name: SoundName) => {
    const child = getCurrentChild()
    if (child && !child.settings.soundEnabled) return

    const now = Date.now()
    if (now - lastPlayRef.current < 100) return
    lastPlayRef.current = now

    try {
      const ctx = getAudioContext()
      SOUNDS[name](ctx)
    } catch {
      // Audio not supported
    }
  }, [getCurrentChild])

  return { play }
}
