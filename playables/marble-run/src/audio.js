/**
 * Oscillators only — no audio files, so sound costs zero bytes.
 *
 * The context is created on the first touch: mobile WebViews block audio that
 * starts without a gesture, and a context left `suspended` kills every sound.
 */
export function createAudio() {
  let context = null
  let muted = false

  function unlock() {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) {
        return
      }
      context = new AudioContextClass()
    }
    if (context.state === 'suspended') {
      context.resume()
    }
  }

  function tone({ frequency, duration, type = 'sine', volume = 0.16, slideTo = null, delay = 0 }) {
    if (!context || muted) {
      return
    }

    const start = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
    }

    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }

  return {
    unlock,
    setMuted(value) {
      muted = value
    },
    gem() {
      tone({ frequency: 880, slideTo: 1500, duration: 0.12, type: 'triangle', volume: 0.12 })
    },
    hit() {
      tone({ frequency: 180, slideTo: 60, duration: 0.28, type: 'sawtooth', volume: 0.2 })
    },
    win() {
      const notes = [523, 659, 784, 1047]
      notes.forEach((frequency, index) => {
        tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.16, delay: index * 0.09 })
      })
    },
    lose() {
      tone({ frequency: 420, slideTo: 150, duration: 0.5, type: 'square', volume: 0.13 })
    },
  }
}
