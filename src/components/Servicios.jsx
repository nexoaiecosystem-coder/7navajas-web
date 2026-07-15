import { useEffect, useState } from 'react'
import { useCatalogo } from '../lib/catalogo'
import { fotoServicio } from '../data/fotosServicios'

const plata = (n) => '$' + (n || 0).toLocaleString('es-UY')

export default function Servicios({ onReservar }) {
  const { servicios } = useCatalogo()
  const [abierto, setAbierto] = useState(false)

  // Si llegan navegando a #servicios (hero o menú), desplegar solo
  useEffect(() => {
    const revisar = () => {
      if (window.location.hash === '#servicios') setAbierto(true)
    }
    revisar()
    window.addEventListener('hashchange', revisar)
    return () => window.removeEventListener('hashchange', revisar)
  }, [])

  const reservar = (id) => onReservar({ servicio: id })

  return (
    <section id="servicios">
      <div className="container">
        <span className="section-tag">Lista de precios</span>
        <h2 className="section-title">Servicios</h2>

        <button
          className="servicios-toggle"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
        >
          <span>{abierto ? 'Ocultar la lista' : 'Ver precios y servicios'}</span>
          <svg
            className={abierto ? 'chevron girado' : 'chevron'}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className={abierto ? 'servicios-despliegue abierto' : 'servicios-despliegue'}>
          <div className="servicios-inner">
            <p className="section-nota">Tocá un servicio para reservarlo.</p>
            <div className="servicios-grid">
              {servicios.map((s) => (
                <article
                  className="servicio-card"
                  key={s.id}
                  role="button"
                  tabIndex={abierto ? 0 : -1}
                  onClick={() => reservar(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      reservar(s.id)
                    }
                  }}
                >
                  <div className="servicio-foto">
                    <img src={fotoServicio(s)} alt={s.nombre} loading="lazy" />
                  </div>
                  <div className="servicio-cuerpo">
                    <h3 className="servicio-nombre">{s.nombre}</h3>
                    <div className="servicio-chips">
                      <span className="chip-precio">{plata(s.precio)}</span>
                      {s.nota && <span className="chip-nota">{s.nota}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
