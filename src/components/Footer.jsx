import { NEGOCIO, HORARIOS_TEXTO } from '../data/negocio'
import logo from '../assets/logo.jpg'

export default function Footer({ onCancelar }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-marca">
            <img src={logo} alt="Logo 7 Navajas" className="logo-img" />
            <div>
              <strong>7 Navajas Barber</strong>
              <p>Wilson Ferreira Aldunate n°51, Paso Carrasco</p>
            </div>
          </div>

          <nav className="footer-columna" aria-label="Secciones">
            <h4>Secciones</h4>
            <a href="#servicios">Servicios</a>
            <a href="#barberos">Barberos</a>
            <a href="#galeria">Galería</a>
            <a href="#ubicacion">Ubicación</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="footer-columna">
            <h4>Horarios</h4>
            {HORARIOS_TEXTO.map((h) => (
              <p key={h.dias}>
                {h.dias}: {h.horas}
              </p>
            ))}
          </div>

          <div className="footer-columna">
            <h4>Turnos</h4>
            <button className="footer-link" onClick={onCancelar}>
              Cancelar un turno
            </button>
            <a href={NEGOCIO.instagramUrl} target="_blank" rel="noreferrer">
              @{NEGOCIO.instagram}
            </a>
            <a href="#panel" className="footer-panel">
              Acceso barberos
            </a>
          </div>
        </div>

        <div className="footer-pie">
          <p>© {new Date().getFullYear()} {NEGOCIO.nombre} — Paso Carrasco, Montevideo</p>
        </div>
      </div>
    </footer>
  )
}
