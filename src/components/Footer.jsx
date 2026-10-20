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
              <a className="footer-ig" href={NEGOCIO.instagramUrl} target="_blank" rel="noreferrer">
                @{NEGOCIO.instagram}
              </a>
            </div>
          </div>

          <div className="footer-nav-horarios">
            <nav className="footer-columna" aria-label="Secciones">
              <h4>Secciones</h4>
              <a href="#servicios">Servicios</a>
              <a href="#barberos">Barberos</a>
              <a href="#galeria">Galería</a>
              <a href="#ubicacion">Ubicación</a>
              <a href="#contacto">Contacto</a>
              <a href="#panel">Acceso barberos</a>
            </nav>

            <div className="footer-columna">
              <h4>Horarios</h4>
              {HORARIOS_TEXTO.map((h) => (
                <p key={h.dias}>
                  {h.dias}: {h.horas}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-cancelar-fila">
          <button className="btn btn-outline footer-cancelar" onClick={onCancelar}>
            ¿Ya reservaste? Cancelá tu turno acá
          </button>
        </div>

        <div className="footer-pie">
          <p>© {new Date().getFullYear()} {NEGOCIO.nombre} — Paso Carrasco, Montevideo</p>
          <p className="footer-credito">
            Desarrollado por <span>Victory &amp; Solutions</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
