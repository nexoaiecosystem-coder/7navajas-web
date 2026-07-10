import { BARBEROS, SERVICIOS } from '../data/negocio'

export default function Sobre() {
  return (
    <section className="sobre" id="sobre">
      <div className="container sobre-grid">
        <div className="sobre-texto">
          <span className="section-tag">Sobre nosotros</span>
          <h2 className="section-title">El oficio primero</h2>
          <p>
            7 Navajas es la barbería del barrio en Paso Carrasco. Acá no hay
            apuro ni cortes en serie: cada cliente se atiende con el tiempo que
            el trabajo pide, desde el corte clásico hasta el color completo.
          </p>
          <p>
            Somos tres barberos con estilos propios y una sola regla: que te
            vayas mejor de lo que llegaste.
          </p>
        </div>
        <div className="sobre-datos">
          <div className="dato">
            <strong>{BARBEROS.length}</strong>
            <span>barberos en el equipo</span>
          </div>
          <div className="dato">
            <strong>{SERVICIOS.length}</strong>
            <span>servicios, del corte jubilado al full color</span>
          </div>
          <div className="dato">
            <strong>6 días</strong>
            <span>a la semana, de lunes a sábado</span>
          </div>
        </div>
      </div>
    </section>
  )
}
