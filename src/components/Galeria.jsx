import { NEGOCIO } from '../data/negocio'
import corte01 from '../assets/galeria/corte-01.jpg'
import corte02 from '../assets/galeria/corte-02.jpg'
import corte03 from '../assets/galeria/corte-03.jpg'
import corte04 from '../assets/galeria/corte-04.jpg'
import corte05 from '../assets/galeria/corte-05.jpg'
import corte06 from '../assets/galeria/corte-06.jpg'
import corte07 from '../assets/galeria/corte-07.jpg'
import corte08 from '../assets/galeria/corte-08.jpg'

const FOTOS = [
  { src: corte01, alt: 'Corte plateado visto desde arriba' },
  { src: corte02, alt: 'Platinado full ice con fade' },
  { src: corte03, alt: 'Fade con diseño de rayo' },
  { src: corte04, alt: 'Bicolor platinado con líneas' },
  { src: corte05, alt: 'Crop plateado con raya marcada' },
  { src: corte06, alt: 'Taper clásico con barba perfilada' },
  { src: corte07, alt: 'Degradé con diseño freestyle' },
  { src: corte08, alt: 'Mullet con burst fade y puntas escarchadas' },
]

export default function Galeria() {
  return (
    <section className="galeria" id="galeria">
      <div className="container">
        <span className="section-tag">Trabajos reales</span>
        <h2 className="section-title">Los cortes hablan</h2>
        <div className="galeria-grid">
          {FOTOS.map((f) => (
            <figure className="galeria-item" key={f.src}>
              <img src={f.src} alt={f.alt} loading="lazy" />
            </figure>
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
    </section>
  )
}
