export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <span className="hero-tag">Barbería · Paso Carrasco, Montevideo</span>
        <h1 className="hero-title">
          <span className="num">7</span> Navajas
        </h1>
        <p className="hero-sub">
          Cortes, barba y color hechos con oficio. Reservá tu turno online y
          venite sin esperas.
        </p>
        <div className="hero-actions">
          <a href="#reserva" className="btn btn-primary">
            Reservar turno
          </a>
          <a href="#servicios" className="btn btn-outline">
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  )
}
