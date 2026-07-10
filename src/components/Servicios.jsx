import { SERVICIOS } from '../data/negocio'

export default function Servicios({ onReservar }) {
  return (
    <section id="servicios">
      <div className="container">
        <span className="section-tag">Lista de precios</span>
        <h2 className="section-title">Servicios</h2>
        <div className="servicios-grid">
          {SERVICIOS.map((s) => (
            <article className="servicio-card" key={s.id}>
              <div className="servicio-head">
                <h3 className="servicio-nombre">{s.nombre}</h3>
                <span className="servicio-precio">${s.precio}</span>
              </div>
              {s.nota && <p className="servicio-nota">{s.nota}</p>}
              <button
                className="btn btn-outline btn-small"
                onClick={() => onReservar({ servicio: s.id })}
              >
                Reservar este servicio
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
