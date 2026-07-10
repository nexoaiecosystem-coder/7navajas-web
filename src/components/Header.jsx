import logo from '../assets/logo.jpg'

export default function Header({ onReservar }) {
  return (
    <header className="header">
      <div className="header-inner">
        <a href="#" className="logo">
          <img src={logo} alt="Logo 7 Navajas" className="logo-img" />
          <span>
            <em>7</em> Navajas
          </span>
        </a>
        <nav className="nav">
          <a href="#servicios">Servicios</a>
          <a href="#galeria">Galería</a>
          <a href="#barberos">Barberos</a>
          <a href="#ubicacion">Ubicación</a>
          <button className="nav-cta" onClick={() => onReservar()}>
            Reservar
          </button>
        </nav>
      </div>
    </header>
  )
}
