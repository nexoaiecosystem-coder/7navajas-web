import { SERVICIOS } from '../data/negocio'

// Ícono según el tipo de servicio: tijera (corte), navaja (barba),
// gota (color) o destello (cejas)
function iconoDe(id) {
  if (id.includes('barba')) return 'navaja'
  if (id === 'cejas') return 'destello'
  if (['mechas', 'full-color', 'franja'].includes(id)) return 'gota'
  return 'tijera'
}

function Icono({ tipo }) {
  const trazos = {
    tijera: (
      <>
        <circle cx="6" cy="6" r="2.6" />
        <circle cx="6" cy="18" r="2.6" />
        <path d="M8.2 7.6 20 19M8.2 16.4 20 5" />
      </>
    ),
    navaja: (
      <>
        <path d="M4 20l9-9" />
        <path d="M11.5 8.5l4-4 4 4-4 4z" />
      </>
    ),
    gota: <path d="M12 3.5s5.5 6.5 5.5 10.5a5.5 5.5 0 0 1-11 0C6.5 10 12 3.5 12 3.5z" />,
    destello: <path d="M12 3l2.2 5.3L19.5 10l-5.3 1.7L12 17l-2.2-5.3L4.5 10l5.3-1.7L12 3z" />,
  }
  return (
    <svg
      className="servicio-icono"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos[tipo]}
    </svg>
  )
}

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
                <Icono tipo={iconoDe(s.id)} />
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
