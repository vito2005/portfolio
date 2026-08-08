/**
 * The overlay is plain DOM on top of the canvas — cheaper to draw, cheaper in
 * bytes and far easier to restyle than the same thing rendered in WebGL.
 */
export function createUi() {
  const progressFill = document.getElementById('progress-fill')
  const gemsCount = document.getElementById('gems-count')
  const lives = Array.from(document.querySelectorAll('.life'))
  const tutorial = document.getElementById('tutorial')
  const endcard = document.getElementById('endcard')
  const endcardTitle = document.getElementById('endcard-title')
  const endcardText = document.getElementById('endcard-text')
  const cta = document.getElementById('cta')
  const replay = document.getElementById('replay')

  let tutorialHidden = false

  return {
    setProgress(value) {
      progressFill.style.width = `${Math.min(100, value * 100).toFixed(1)}%`
    },

    setGems(value) {
      gemsCount.textContent = String(value)
      // Restart the pop: removing the class isn't enough on its own, the
      // reflow in between is what makes the browser replay the animation.
      gemsCount.classList.remove('pop')
      void gemsCount.offsetWidth
      gemsCount.classList.add('pop')
    },

    setLives(remaining) {
      lives.forEach((life, index) => {
        life.classList.toggle('lost', index >= remaining)
      })
    },

    hideTutorial() {
      if (tutorialHidden) {
        return
      }
      tutorialHidden = true
      tutorial.style.opacity = '0'
      // Wait for the fade before removing it from the layout.
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
      // The whole endcard is the call to action — networks measure clicks on it,
      // and a player who taps next to the button still meant to tap the button.
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
