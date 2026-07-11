import { NEGOCIO } from '../data/negocio'

export default function Contacto({ onReservar, onCancelar }) {
  return (
    <section id="contacto">
      <div className="container">
        <span className="section-tag">Hablemos</span>
        <h2 className="section-title">Contacto</h2>
        <div className="contacto-grid">
          <article className="contacto-card">
            <div className="contacto-icono">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h3>Instagram</h3>
            <p>
              Escribinos por mensaje directo para consultas, precios de color o
              lo que necesites.
            </p>
            <a
              className="btn btn-outline btn-small"
              href={NEGOCIO.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              @{NEGOCIO.instagram}
            </a>
          </article>

          <article className="contacto-card">
            <div className="contacto-icono">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>
            <h3>Venite al local</h3>
            <p>{NEGOCIO.direccion}. Lunes 12–19, martes a sábado 11–20.</p>
            <a
              className="btn btn-outline btn-small"
              href={NEGOCIO.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Cómo llegar
            </a>
          </article>

          <article className="contacto-card">
            <div className="contacto-icono">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            </div>
            <h3>Turnos online</h3>
            <p>
              Reservá tu horario en dos toques, y si no llegás, cancelalo vos
              mismo desde acá.
            </p>
            <div className="contacto-acciones">
              <button className="btn btn-primary btn-small" onClick={() => onReservar()}>
                Reservar
              </button>
              <button className="btn btn-outline btn-small" onClick={onCancelar}>
                Cancelar turno
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
