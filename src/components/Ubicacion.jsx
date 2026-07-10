import { NEGOCIO, HORARIOS_TEXTO } from '../data/negocio'

export default function Ubicacion() {
  return (
    <section className="ubicacion" id="ubicacion">
      <div className="container">
        <span className="section-tag">Dónde estamos</span>
        <h2 className="section-title">Ubicación y horarios</h2>
        <div className="ubicacion-grid">
          <div className="ubicacion-bloque">
            <h3>Dirección</h3>
            <p>{NEGOCIO.direccion}</p>
            <a
              className="btn btn-outline btn-small"
              href={NEGOCIO.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Cómo llegar
            </a>
          </div>
          <div className="ubicacion-bloque">
            <h3>Horarios</h3>
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
      </div>
    </section>
  )
}
