// Let overlays respond immediately to keyboard input, including Escape on exit.
const keyboard = () => { if (document.documentElement.dataset.input !== 'keyboard') document.documentElement.dataset.input = 'keyboard' }
const pointer = () => { if (document.documentElement.dataset.input !== 'pointer') document.documentElement.dataset.input = 'pointer' }
document.addEventListener('keydown', keyboard, true)
document.addEventListener('pointerdown', pointer, true)
if (import.meta.hot) import.meta.hot.dispose(() => {
  document.removeEventListener('keydown', keyboard, true)
  document.removeEventListener('pointerdown', pointer, true)
})
