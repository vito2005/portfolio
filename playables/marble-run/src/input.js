/**
 * One axis of input, from a *relative* drag: the marble moves from where it
 * already is rather than teleporting under the finger, which is the difference
 * between responsive and twitchy on a phone. Arrow keys are for desktop testing.
 */
export function createInput(element) {
  const state = { value: 0, interacted: false }
  const keys = { left: false, right: false }

  let dragging = false
  let originX = 0
  let originValue = 0
  let onFirstInput = null

  /** Full lock-to-lock in roughly 42% of the screen width. */
  function span() {
    return Math.max(160, window.innerWidth * 0.42)
  }

  function clamp(value) {
    return Math.max(-1, Math.min(1, value))
  }

  function markInteracted() {
    if (state.interacted) {
      return
    }
    state.interacted = true
    onFirstInput?.()
  }

  function beginDrag(x) {
    dragging = true
    originX = x
    originValue = state.value
    markInteracted()
  }

  function moveDrag(x) {
    if (!dragging) {
      return
    }
    // The axis runs -1..1, so a full span of travel is 2 units of value.
    state.value = clamp(originValue + ((x - originX) / span()) * 2)
  }

  function endDrag() {
    dragging = false
  }

  function handleTouchStart(event) {
    event.preventDefault()
    beginDrag(event.touches[0].clientX)
  }

  function handleTouchMove(event) {
    event.preventDefault()
    moveDrag(event.touches[0].clientX)
  }

  function handleMouseDown(event) {
    beginDrag(event.clientX)
  }

  function handleMouseMove(event) {
    moveDrag(event.clientX)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      keys.left = true
      markInteracted()
    }
    if (event.key === 'ArrowRight') {
      keys.right = true
      markInteracted()
    }
  }

  function handleKeyUp(event) {
    if (event.key === 'ArrowLeft') {
      keys.left = false
    }
    if (event.key === 'ArrowRight') {
      keys.right = false
    }
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', endDrag)
  element.addEventListener('touchcancel', endDrag)
  element.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  /** Keyboard only — a drag writes `state.value` directly. */
  function update(delta) {
    const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    if (direction !== 0) {
      state.value = clamp(state.value + direction * delta * 2.2)
    }
  }

  function reset() {
    state.value = 0
    dragging = false
  }

  function dispose() {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', endDrag)
    element.removeEventListener('touchcancel', endDrag)
    element.removeEventListener('mousedown', handleMouseDown)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', endDrag)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }

  return {
    state,
    update,
    reset,
    dispose,
    set firstInput(callback) {
      onFirstInput = callback
    },
  }
}
