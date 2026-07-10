import { BARBEROS } from '../data/negocio'

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export default function Barberos({ onReservar }) {
  return (
    <section className="barberos" id="barberos">
      <div className="container">
        <span className="section-tag">El equipo</span>
        <h2 className="section-title">Barberos</h2>
        <div className="barberos-grid">
          {BARBEROS.map((b) => (
            <article className="barbero-card" key={b.id}>
              <div className="barbero-avatar">{iniciales(b.nombre)}</div>
              <h3 className="barbero-nombre">{b.nombre}</h3>
              <p className="barbero-apodo">
                {b.apodo ? `"${b.apodo}"` : ' '}
              </p>
              <button
                className="btn btn-primary btn-small"
                onClick={() => onReservar({ barbero: b.id })}
              >
                Reservar con {b.apodo || b.nombre}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
