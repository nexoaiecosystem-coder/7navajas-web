import { RESENIAS } from '../data/negocio'
import Reveal from './Reveal'

export default function Resenias() {
  return (
    <section id="resenias">
      <div className="container">
        <Reveal>
          <span className="section-tag">Clientes</span>
          <h2 className="section-title">Lo que dicen de nosotros</h2>
        </Reveal>
        <div className="resenias-grid">
          {RESENIAS.map((r, i) => (
            <Reveal as="blockquote" className="resenia" key={r.nombre} delay={Math.min(i * 80, 400)}>
              <span className="resenia-estrellas" aria-label={`${r.estrellas} estrellas`}>
                {'★'.repeat(r.estrellas)}
              </span>
              <p>"{r.texto}"</p>
              <footer>— {r.nombre}</footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
