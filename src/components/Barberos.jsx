import { useCatalogo } from '../lib/catalogo'
import Reveal from './Reveal'
import ImgFade from './ImgFade'

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export default function Barberos({ onReservar }) {
  const { barberos } = useCatalogo()
  const reservar = (id) => onReservar({ barbero: id })

  return (
    <section className="barberos" id="barberos">
      <div className="container">
        <Reveal>
          <span className="section-tag">El equipo</span>
          <h2 className="section-title">Barberos</h2>
        </Reveal>
        <div className="barberos-grid">
          {barberos.map((b, i) => (
            <Reveal
              as="article"
              className="barbero-card"
              key={b.id}
              delay={Math.min(i * 80, 400)}
              role="button"
              tabIndex={0}
              onClick={() => reservar(b.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  reservar(b.id)
                }
              }}
            >
              <div className="barbero-retrato">
                {b.foto_url ? (
                  <ImgFade src={b.foto_url} alt={b.nombre} />
                ) : (
                  <span className="barbero-retrato-iniciales">{iniciales(b.nombre)}</span>
                )}
              </div>
              <div className="barbero-cuerpo">
                <h3 className="barbero-nombre">{b.apodo || b.nombre}</h3>
                <p className="barbero-apodo">Barbero</p>
                <span className="card-reservar">Reservar turno →</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
