import { useCatalogo } from '../lib/catalogo'

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
        <span className="section-tag">El equipo</span>
        <h2 className="section-title">Barberos</h2>
        <div className="barberos-grid">
          {barberos.map((b) => (
            <article
              className="barbero-card"
              key={b.id}
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
              {b.foto_url ? (
                <img className="barbero-foto" src={b.foto_url} alt={b.nombre} loading="lazy" />
              ) : (
                <div className="barbero-avatar">{iniciales(b.nombre)}</div>
              )}
              <h3 className="barbero-nombre">{b.nombre}</h3>
              <p className="barbero-apodo">{b.apodo ? `"${b.apodo}"` : 'Barbero'}</p>
              <span className="card-reservar">Reservar con {b.apodo || b.nombre} →</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
