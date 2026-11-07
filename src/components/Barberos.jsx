import { useCatalogo } from '../lib/catalogo'
import Reveal from './Reveal'
import ImgFade from './ImgFade'

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

// teléfonos guardados en formato local (ej. "099123456"): para WhatsApp hay
// que sacar el 0 inicial y anteponer el código de país de Uruguay
function whatsappUrl(telefono) {
  const digitos = (telefono || '').replace(/\D/g, '')
  const sinCero = digitos.startsWith('0') ? digitos.slice(1) : digitos
  const conPais = sinCero.startsWith('598') ? sinCero : `598${sinCero}`
  return `https://wa.me/${conPais}`
}

const telefonoLindo = (t) => (t || '').replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3')

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
                {b.whatsapp && (
                  <a
                    className="barbero-whatsapp"
                    href={whatsappUrl(b.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.82L2 22l5.4-1.42a9.9 9.9 0 0 0 4.64 1.18h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.21 0 4.29.86 5.85 2.42a8.23 8.23 0 0 1 2.42 5.82c0 4.55-3.71 8.25-8.27 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.56 3.71-8.25 8.24-8.25M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.01 2.57c.13.16 1.76 2.69 4.33 3.77.6.26 1.07.42 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.07-.1-.23-.16-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.98-.15.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.13-.56-1.36-.78-1.86-.2-.49-.41-.42-.56-.43h-.48Z" />
                    </svg>
                    {telefonoLindo(b.whatsapp)}
                  </a>
                )}
                <span className="card-reservar">Reservar turno →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
