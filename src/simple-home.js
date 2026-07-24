import { switchHomeVersion } from './home-version.js'

const coolerVersionBtn = document.getElementById('cooler-version')
if (coolerVersionBtn) {
  coolerVersionBtn.addEventListener('click', (event) => {
    event.preventDefault()
    switchHomeVersion('cooler')
  })
}

const typewriterElement = document.getElementById('typewriter')
if (typewriterElement) {
  const texts = [
    'Full-Stack Developer',
    'Photoshop Savant',
    'Photographer',
    'Tech Enthusiast',
    'Startup Founder',
    'Cat Enthusiast',
  ]

  let textIndex = 0
  let charIndex = 0
  let isDeleting = false
  let typeSpeed = 100
  const deleteSpeed = 50
  const pauseTime = 2000

  function typeWriter() {
    const currentText = texts[textIndex]

    if (isDeleting) {
      typewriterElement.textContent = currentText.substring(0, charIndex - 1)
      charIndex--
      typeSpeed = deleteSpeed
    } else {
      typewriterElement.textContent = currentText.substring(0, charIndex + 1)
      charIndex++
      typeSpeed = 100
    }

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = pauseTime
      isDeleting = true
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false
      textIndex = (textIndex + 1) % texts.length
      typeSpeed = 500
    }

    setTimeout(typeWriter, typeSpeed)
  }

  // Start immediately — this module may load after window "load" already fired
  setTimeout(typeWriter, 1000)
}
