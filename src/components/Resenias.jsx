import { RESENIAS } from '../data/negocio'

export default function Resenias() {
  return (
    <section id="resenias">
      <div className="container">
        <span className="section-tag">Clientes</span>
        <h2 className="section-title">Lo que dicen de nosotros</h2>
        <div className="resenias-grid">
          {RESENIAS.map((r) => (
            <blockquote className="resenia" key={r.nombre}>
              <span className="resenia-estrellas" aria-label={`${r.estrellas} estrellas`}>
                {'★'.repeat(r.estrellas)}
              </span>
              <p>"{r.texto}"</p>
              <footer>— {r.nombre}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
