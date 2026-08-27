export default function Hero({ onReservar }) {
  return (
    <section className="hero">
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
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
          <button className="btn btn-primary" onClick={() => onReservar()}>
            Reservar turno
          </button>
          <a href="#servicios" className="btn btn-outline">
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  )
}
