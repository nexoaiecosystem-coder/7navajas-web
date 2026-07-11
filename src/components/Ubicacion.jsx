import { NEGOCIO, HORARIOS, HORARIOS_TEXTO } from '../data/negocio'

// ¿Está abierta la barbería en este momento? (hora de Uruguay)
function abiertoAhora() {
  const ahora = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Montevideo' }),
  )
  const rango = HORARIOS[ahora.getDay()]
  if (!rango) return false
  const hora = ahora.getHours() + ahora.getMinutes() / 60
  return hora >= rango[0] && hora < rango[1]
}

export default function Ubicacion() {
  const abierto = abiertoAhora()
  return (
    <section className="ubicacion" id="ubicacion">
      <div className="container">
        <span className="section-tag">Dónde estamos</span>
        <h2 className="section-title">Ubicación y horarios</h2>
        <div className="ubicacion-grid">
          <div className="ubicacion-bloque">
            <h3>Dirección</h3>
            <p>{NEGOCIO.direccion}</p>
          </div>
          <div className="ubicacion-bloque">
            <h3>
              Horarios{' '}
              <span className={abierto ? 'estado-chip abierto' : 'estado-chip cerrado'}>
                <span className="punto" />
                {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
              </span>
            </h3>
            <table className="horarios-tabla">
              <tbody>
                {HORARIOS_TEXTO.map((h) => (
                  <tr key={h.dias}>
                    <td>{h.dias}</td>
                    <td>{h.horas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mapa-marco">
          <iframe
            className="mapa"
            title="Mapa: 7 Navajas Barber"
            src="https://www.google.com/maps?q=Wilson%20Ferreira%20Aldunate%2051%2C%20Paso%20Carrasco%2C%20Canelones%2C%20Uruguay&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            className="btn btn-primary btn-small mapa-boton"
            href={NEGOCIO.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar
          </a>
        </div>
      </div>
    </section>
  )
}
