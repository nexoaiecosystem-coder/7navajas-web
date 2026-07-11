import { NEGOCIO } from '../data/negocio'

export default function Footer({ onCancelar }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>
          © {new Date().getFullYear()} {NEGOCIO.nombre} — Paso Carrasco, Montevideo
        </p>
        <p>
          <a href={NEGOCIO.instagramUrl} target="_blank" rel="noreferrer">
            @{NEGOCIO.instagram}
          </a>
          {' · '}
          <button className="footer-link" onClick={onCancelar}>
            Cancelar un turno
          </button>
          {' · '}
          <a href="#panel" className="footer-panel">
            Acceso barberos
          </a>
        </p>
      </div>
    </footer>
  )
}
