import { SERVICIOS } from '../data/negocio'

export default function Servicios({ onReservar }) {
  const reservar = (id) => onReservar({ servicio: id })

  return (
    <section id="servicios">
      <div className="container">
        <span className="section-tag">Lista de precios</span>
        <h2 className="section-title">Servicios</h2>
        <p className="section-nota">Tocá un servicio para reservarlo.</p>
        <div className="servicios-grid">
          {SERVICIOS.map((s) => (
            <article
              className="servicio-card"
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => reservar(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  reservar(s.id)
                }
              }}
            >
              <div className="servicio-head">
                <h3 className="servicio-nombre">{s.nombre}</h3>
                <span className="servicio-precio">${s.precio}</span>
              </div>
              {s.nota && <p className="servicio-nota">{s.nota}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
