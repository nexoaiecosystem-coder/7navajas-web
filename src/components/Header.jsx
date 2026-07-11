import { useEffect, useState } from 'react'
import logo from '../assets/logo.jpg'

const SECCIONES = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#barberos', label: 'Barberos' },
  { href: '#sobre', label: 'Sobre nosotros' },
  { href: '#galeria', label: 'Galería' },
  { href: '#resenias', label: 'Reseñas' },
  { href: '#ubicacion', label: 'Ubicación y horarios' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Header({ onReservar, onCuenta, usuario }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    if (!menuAbierto) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuAbierto])

  const cerrar = () => setMenuAbierto(false)

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="#" className="logo">
            <img src={logo} alt="Logo 7 Navajas" className="logo-img" />
            <span>
              <em>7</em> Navajas
            </span>
          </a>
          <div className="header-acciones">
            <button
              className={usuario ? 'icono-btn activo' : 'icono-btn'}
              onClick={onCuenta}
              aria-label={usuario ? 'Tu cuenta' : 'Ingresar a tu cuenta'}
              title={usuario ? 'Tu cuenta' : 'Ingresar a tu cuenta'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
              </svg>
            </button>
            <button
              className="icono-btn"
              aria-label="Abrir menú"
              onClick={() => setMenuAbierto(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuAbierto && (
        <div
          className="drawer-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrar()
          }}
        >
          <nav className="drawer" aria-label="Menú principal">
            <button className="modal-close" onClick={cerrar} aria-label="Cerrar menú">
              ×
            </button>
            <span className="section-tag">Menú</span>
            <ul className="drawer-links">
              <li>
                <a href="#" onClick={cerrar}>
                  Inicio
                </a>
              </li>
              {SECCIONES.map((s) => (
                <li key={s.href}>
                  <a href={s.href} onClick={cerrar}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              className="btn btn-primary drawer-reservar"
              onClick={() => {
                cerrar()
                onReservar()
              }}
            >
              Reservar turno
            </button>
            <button
              className="btn btn-outline drawer-reservar"
              onClick={() => {
                cerrar()
                onCuenta()
              }}
            >
              {usuario ? 'Tu cuenta' : 'Ingresar / Crear cuenta'}
            </button>
            <a className="drawer-pie" href="#panel" onClick={cerrar}>
              Acceso barberos
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
