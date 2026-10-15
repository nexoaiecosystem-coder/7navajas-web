const MAX_DEG = 7

const prefiereMenosMovimiento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function onTiltMove(e) {
  if (prefiereMenosMovimiento()) return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  el.style.setProperty('--tilt-x', `${(-py * MAX_DEG * 2).toFixed(2)}deg`)
  el.style.setProperty('--tilt-y', `${(px * MAX_DEG * 2).toFixed(2)}deg`)
}

export function onTiltLeave(e) {
  const el = e.currentTarget
  el.style.setProperty('--tilt-x', '0deg')
  el.style.setProperty('--tilt-y', '0deg')
}
