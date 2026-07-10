export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <a href="#" className="logo">
          <em>7</em> Navajas
        </a>
        <nav className="nav">
          <a href="#servicios">Servicios</a>
          <a href="#barberos">Barberos</a>
          <a href="#ubicacion">Ubicación</a>
          <a href="#reserva" className="nav-cta">
            Reservar
          </a>
        </nav>
      </div>
    </header>
  )
}
