/** Plain DOM on top of the canvas — cheaper to draw and to ship than WebGL text. */
export function createUi() {
  const moves = document.getElementById('moves')
  const sorted = document.getElementById('sorted')
  const tutorial = document.getElementById('tutorial')
  const endcard = document.getElementById('endcard')
  const endcardTitle = document.getElementById('endcard-title')
  const endcardText = document.getElementById('endcard-text')
  const replay = document.getElementById('replay')

  let tutorialHidden = false

  /** Restarts a CSS animation: the reflow in between is what replays it. */
  function pop(element, className) {
    element.classList.remove(className)
    void element.offsetWidth
    element.classList.add(className)
  }

  return {
    setMoves(value, low) {
      moves.textContent = String(value)
      moves.classList.toggle('low', low)
      pop(moves, 'tick')
    },

    setSorted(value, total) {
      sorted.textContent = `${value}/${total}`
      pop(sorted, 'tick')
    },

    hideTutorial() {
      if (tutorialHidden) {
        return
      }
      tutorialHidden = true
      tutorial.style.opacity = '0'
      setTimeout(() => tutorial.classList.add('hidden'), 400)
    },

    showEndcard({ title, text }) {
      endcardTitle.textContent = title
      endcardText.textContent = text
      endcard.classList.remove('hidden')
    },

    hideEndcard() {
      endcard.classList.add('hidden')
    },

    onCta(callback) {
      // The whole endcard is the call to action — a player who taps beside the
      // button still meant to tap the button.
      endcard.addEventListener('click', (event) => {
        if (event.target !== replay) {
          callback()
        }
      })
    },

    onReplay(callback) {
      replay.addEventListener('click', callback)
    },
  }
}
