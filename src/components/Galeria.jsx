import { useEffect, useState } from 'react'
import { NEGOCIO } from '../data/negocio'
import { useCatalogo } from '../lib/catalogo'
import Reveal from './Reveal'
import ImgFade from './ImgFade'

export default function Galeria() {
  const { galeria } = useCatalogo()
  const [grande, setGrande] = useState(null) // foto abierta en el lightbox

  useEffect(() => {
    if (!grande) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setGrande(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [grande])

  if (galeria.length === 0) return null

  return (
    <section className="galeria" id="galeria">
      <div className="container">
        <Reveal>
          <span className="section-tag">Trabajos reales</span>
          <h2 className="section-title">Los cortes hablan</h2>
        </Reveal>
        <div className="galeria-grid">
          {galeria.map((f, i) => (
            <Reveal
              as="figure"
              className="galeria-item"
              key={f.id}
              delay={Math.min(i * 60, 360)}
              role="button"
              tabIndex={0}
              onClick={() => setGrande(f)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setGrande(f)
              }}
            >
              <ImgFade src={f.foto_url} alt={f.alt || ''} />
            </Reveal>
          ))}
        </div>
        <div className="galeria-cta">
          <p>Hay más en el Instagram, actualizado todas las semanas.</p>
          <a
            className="btn btn-outline"
            href={NEGOCIO.instagramUrl}
            target="_blank"
            rel="noreferrer"
          >
            Seguinos en @{NEGOCIO.instagram}
          </a>
        </div>
      </div>

      {grande && (
        <div className="lightbox" onClick={() => setGrande(null)}>
          <button className="modal-close" aria-label="Cerrar">
            ×
          </button>
          <img src={grande.foto_url} alt={grande.alt || ''} />
        </div>
      )}
    </section>
  )
}
