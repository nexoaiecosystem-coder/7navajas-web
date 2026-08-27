import { useEffect, useRef, useState } from 'react'

// Detecta cuándo un elemento entra en pantalla, una sola vez, para animarlo al scrollear
export function useReveal(options) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px', ...options },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, visible]
}
