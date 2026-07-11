import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BARBEROS, SERVICIOS } from '../data/negocio'

// fecha local (no UTC, que cambia de día a las 21:00 de Uruguay)
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function moverDia(fechaStr, dias) {
  const d = new Date(fechaStr + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

// Semana de lunes a domingo que contiene a la fecha
function rangoSemana(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00')
  const lunes = moverDia(fechaStr, -((d.getDay() + 6) % 7))
  return [lunes, moverDia(lunes, 6)]
}

// Primer día del mes anterior al de la fecha
function primeroMesAnterior(fechaStr) {
  const [a, m] = fechaStr.split('-').map(Number)
  const d = new Date(a, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const resumen = (filas) => ({
  cantidad: filas.length,
  total: filas.reduce((s, t) => s + (t.precio || 0), 0),
})

const plata = (n) => '$' + (n || 0).toLocaleString('es-UY')

const nombreServicio = (id) => SERVICIOS.find((s) => s.id === id)?.nombre || id
const nombreBarbero = (id) => {
  const b = BARBEROS.find((x) => x.id === id)
  return b ? b.apodo || b.nombre : id
}

function fechaLinda(fechaStr) {
  return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const LETRA_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

// "Mathias Fonseca" → "M. Fonseca" (para que las pestañas entren sin scroll)
const abreviar = (nombre) => {
  const partes = nombre.split(' ')
  return partes.length > 1 ? `${partes[0][0]}. ${partes.slice(1).join(' ')}` : nombre
}

// variación porcentual contra el período anterior (null si no hay base)
function variacion(actual, anterior) {
  if (!anterior) return null
  return Math.round(((actual - anterior) / anterior) * 100)
}

function Delta({ valor }) {
  if (valor === null) return <span className="stat-delta">sin datos previos</span>
  const sube = valor >= 0
  return (
    <span className={sube ? 'stat-delta pos' : 'stat-delta neg'}>
      {sube ? '▲' : '▼'} {Math.abs(valor)}%
    </span>
  )
}

export default function Panel({ usuario, onCuenta }) {
  // acceso.estado: 'cargando' | 'sin-sesion' | 'sin-acceso' | 'ok'
  const [acceso, setAcceso] = useState({ estado: 'cargando', barbero: null, esAdmin: false })

  const [fecha, setFecha] = useState(hoy())
  const [tab, setTab] = useState('todos')
  const [turnos, setTurnos] = useState([])
  const [statsFilas, setStatsFilas] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(false)
  const [compAbierta, setCompAbierta] = useState(false)
  const [diasGrafica, setDiasGrafica] = useState(14)
  const [error, setError] = useState('')
  const [refresco, setRefresco] = useState(0)

  // ¿Esta cuenta es de un barbero? ¿Es el dueño?
  useEffect(() => {
    if (!supabase) return
    if (!usuario) {
      setAcceso({ estado: 'sin-sesion', barbero: null, esAdmin: false })
      return
    }
    let vigente = true
    setAcceso((a) => ({ ...a, estado: 'cargando' }))
    supabase
      .from('barberos_acceso')
      .select('*')
      .eq('email', usuario.email)
      .maybeSingle()
      .then(({ data }) => {
        if (!vigente) return
        if (data) {
          setAcceso({ estado: 'ok', barbero: data.barbero, esAdmin: data.es_admin })
        } else {
          setAcceso({ estado: 'sin-acceso', barbero: null, esAdmin: false })
        }
      })
    return () => {
      vigente = false
    }
  }, [usuario])

  const esAdmin = acceso.esAdmin
  // el barbero común solo se ve a sí mismo; el dueño elige con las pestañas
  const filtro = esAdmin ? tab : acceso.barbero

  // Turnos del día elegido
  useEffect(() => {
    if (acceso.estado !== 'ok') return
    let vigente = true
    setCargando(true)
    setError('')
    supabase
      .from('turnos')
      .select('*')
      .eq('fecha', fecha)
      .order('hora')
      .then(({ data, error: err }) => {
        if (!vigente) return
        if (err) setError('No se pudieron cargar los turnos. Probá de nuevo.')
        else setTurnos(data || [])
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [acceso.estado, fecha, refresco])

  // Filas para estadísticas: desde el mes anterior hasta hoy/fin de mes
  useEffect(() => {
    if (acceso.estado !== 'ok') return
    let vigente = true
    const [, semFin] = rangoSemana(fecha)
    const finMes = rangoSemana(fecha) && fecha.slice(0, 8) + '31'
    const desde = [primeroMesAnterior(fecha), moverDia(hoy(), -29)].sort()[0]
    const hasta = [semFin, finMes, hoy()].sort().slice(-1)[0]
    supabase
      .from('turnos')
      .select('barbero, precio, fecha, servicio')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .then(({ data }) => {
        if (vigente) setStatsFilas(data || [])
      })
    return () => {
      vigente = false
    }
  }, [acceso.estado, fecha, refresco])

  // Registro de trabajos ya hechos (turnos pasados)
  useEffect(() => {
    if (acceso.estado !== 'ok') return
    let vigente = true
    let q = supabase
      .from('turnos')
      .select('*')
      .lt('fecha', hoy())
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(60)
    if (!esAdmin) q = q.eq('barbero', acceso.barbero)
    q.then(({ data }) => {
      if (vigente) setHistorial(data || [])
    })
    return () => {
      vigente = false
    }
  }, [acceso.estado, esAdmin, acceso.barbero, refresco])

  async function cancelar(t) {
    const seguro = window.confirm(
      `¿Cancelar el turno de ${t.cliente_nombre} (${t.hora.slice(0, 5)} con ${nombreBarbero(t.barbero)})?`,
    )
    if (!seguro) return
    const { error: err } = await supabase.from('turnos').delete().eq('id', t.id)
    if (err) {
      setError('No se pudo cancelar el turno.')
      return
    }
    setRefresco((r) => r + 1)
  }

  async function salir() {
    await supabase.auth.signOut()
  }

  /* ---------- pantallas de acceso ---------- */

  if (acceso.estado === 'sin-sesion') {
    return (
      <div className="panel">
        <div className="panel-login">
          <span className="section-tag">Solo barberos</span>
          <h1 className="section-title">Panel de turnos</h1>
          <p className="panel-texto">
            Ingresá con tu cuenta para ver tus turnos, tus estadísticas y el registro de
            trabajos.
          </p>
          <button className="btn btn-primary" onClick={onCuenta}>
            Ingresar con mi cuenta
          </button>
          <a className="panel-volver" href="#">
            ← Volver a la web
          </a>
        </div>
      </div>
    )
  }

  if (acceso.estado === 'cargando') {
    return (
      <div className="panel">
        <div className="panel-login">
          <p className="panel-vacio">Verificando acceso…</p>
        </div>
      </div>
    )
  }

  if (acceso.estado === 'sin-acceso') {
    return (
      <div className="panel">
        <div className="panel-login">
          <span className="section-tag">Solo barberos</span>
          <h1 className="section-title">Sin acceso</h1>
          <p className="panel-texto">
            La cuenta <strong>{usuario.email}</strong> no está habilitada como barbero.
            Pedile al dueño que la habilite.
          </p>
          <div className="cuenta-acciones">
            <button className="btn btn-outline" onClick={salir}>
              Cerrar sesión
            </button>
          </div>
          <a className="panel-volver" href="#">
            ← Volver a la web
          </a>
        </div>
      </div>
    )
  }

  /* ---------- datos calculados ---------- */

  const visibles = filtro === 'todos' ? turnos : turnos.filter((t) => t.barbero === filtro)
  const filasFiltradas =
    filtro === 'todos' ? statsFilas : statsFilas.filter((t) => t.barbero === filtro)

  const [semIni, semFin] = rangoSemana(fecha)
  const [semAntIni, semAntFin] = [moverDia(semIni, -7), moverDia(semIni, -1)]
  const mesClave = fecha.slice(0, 7)
  const mesAntClave = primeroMesAnterior(fecha).slice(0, 7)

  const enRango = (t, ini, fin) => t.fecha >= ini && t.fecha <= fin

  const statDia = resumen(visibles)
  const statSemana = resumen(filasFiltradas.filter((t) => enRango(t, semIni, semFin)))
  const statSemanaAnt = resumen(filasFiltradas.filter((t) => enRango(t, semAntIni, semAntFin)))
  const statMes = resumen(filasFiltradas.filter((t) => t.fecha.slice(0, 7) === mesClave))
  const statMesAnt = resumen(filasFiltradas.filter((t) => t.fecha.slice(0, 7) === mesAntClave))

  // gráfica: ingresos por día en el rango elegido (7, 14 o 30 días)
  const diasSerie = Array.from({ length: diasGrafica }, (_, i) =>
    moverDia(hoy(), i - (diasGrafica - 1)),
  )
  const serie = diasSerie.map((f) => resumen(filasFiltradas.filter((t) => t.fecha === f)).total)
  const maxSerie = Math.max(...serie, 1)
  const slot = 560 / diasGrafica
  const barAncho = Math.round(slot * 0.7)

  // el mes por barbero (vista del dueño: siempre todos)
  const mesFilas = statsFilas.filter((t) => t.fecha.slice(0, 7) === mesClave)
  const porBarbero = BARBEROS.map((b) => ({
    ...b,
    ...resumen(mesFilas.filter((t) => t.barbero === b.id)),
  })).sort((a, b) => b.total - a.total)
  const maxBarbero = Math.max(...porBarbero.map((b) => b.total), 1)

  // servicios más pedidos del mes
  const conteoServicios = {}
  for (const t of mesFilas) conteoServicios[t.servicio] = (conteoServicios[t.servicio] || 0) + 1
  const topServicios = Object.entries(conteoServicios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // historial agrupado por día
  const historialVisible =
    esAdmin && filtro !== 'todos' ? historial.filter((t) => t.barbero === filtro) : historial
  const gruposHistorial = []
  for (const t of historialVisible) {
    const ultimo = gruposHistorial[gruposHistorial.length - 1]
    if (!ultimo || ultimo.fecha !== t.fecha) gruposHistorial.push({ fecha: t.fecha, items: [t] })
    else ultimo.items.push(t)
  }

  return (
    <div className="panel">
      <div className="container">
        <div className="panel-barra">
          <a className="panel-volver" href="#">
            ← Volver a la web
          </a>
          <button className="panel-salir" onClick={salir}>
            Cerrar sesión
          </button>
        </div>

        <header className="panel-head">
          <span className="section-tag">Panel · 7 Navajas</span>
          <h1 className="section-title">Hola, {nombreBarbero(acceso.barbero)}</h1>
          <p className="panel-rol">
            {esAdmin ? 'Dueño · ves todo el negocio' : 'Tus turnos y tus números'}
          </p>
        </header>

        {esAdmin && (
          <div className="panel-tabs">
            <button className={tab === 'todos' ? 'activo' : ''} onClick={() => setTab('todos')}>
              Todos
            </button>
            {BARBEROS.map((b) => (
              <button
                key={b.id}
                className={tab === b.id ? 'activo' : ''}
                onClick={() => setTab(b.id)}
              >
                {b.apodo || abreviar(b.nombre)}
              </button>
            ))}
          </div>
        )}

        {error && <p className="reserva-msg error">{error}</p>}

        {/* ---------- Los números ---------- */}
        <section className="panel-seccion">
          <div className="panel-seccion-head">
            <h2 className="panel-sub">Los números</h2>
            <span className="panel-seccion-nota">
              {filtro === 'todos' ? 'Toda la barbería' : nombreBarbero(filtro)}
            </span>
          </div>
          <div className="panel-stats">
            <div className="stat">
              <span className="stat-label">Este día</span>
              <strong>{plata(statDia.total)}</strong>
              <span className="stat-detalle">
                {statDia.cantidad} {statDia.cantidad === 1 ? 'turno' : 'turnos'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Esta semana</span>
              <strong>{plata(statSemana.total)}</strong>
              <span className="stat-detalle">
                {statSemana.cantidad} {statSemana.cantidad === 1 ? 'turno' : 'turnos'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Este mes</span>
              <strong>{plata(statMes.total)}</strong>
              <span className="stat-detalle">
                {statMes.cantidad} {statMes.cantidad === 1 ? 'turno' : 'turnos'}
              </span>
            </div>
          </div>

          <div className="tabla-marco comparativa">
            <button
              className="comp-toggle"
              onClick={() => setCompAbierta((a) => !a)}
              aria-expanded={compAbierta}
            >
              <span>Cómo venís contra el período anterior</span>
              <svg
                className={compAbierta ? 'chevron girado' : 'chevron'}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className={compAbierta ? 'comp-despliegue abierto' : 'comp-despliegue'}>
              <div className="comp-inner">
                <div className="comp-fila">
                  <span className="comp-nombre">Semana</span>
                  <span className="comp-valores">
                    {plata(statSemanaAnt.total)} → <strong>{plata(statSemana.total)}</strong>
                  </span>
                  <Delta valor={variacion(statSemana.total, statSemanaAnt.total)} />
                </div>
                <div className="comp-fila">
                  <span className="comp-nombre">Mes</span>
                  <span className="comp-valores">
                    {plata(statMesAnt.total)} → <strong>{plata(statMes.total)}</strong>
                  </span>
                  <Delta valor={variacion(statMes.total, statMesAnt.total)} />
                </div>
              </div>
            </div>
          </div>

          {esAdmin && (
            <>
              <div className="grafica-marco">
                <div className="grafica-titulo">
                  <span>Ingresos · últimos {diasGrafica} días</span>
                  <strong>{plata(serie.reduce((a, b) => a + b, 0))}</strong>
                </div>
                <div className="grafica-rangos">
                  {[7, 14, 30].map((n) => (
                    <button
                      key={n}
                      className={diasGrafica === n ? 'activo' : ''}
                      onClick={() => setDiasGrafica(n)}
                    >
                      {n} días
                    </button>
                  ))}
                </div>
                <div className="grafica-scroll">
                  <svg
                    className="grafica"
                    viewBox="0 0 560 175"
                    role="img"
                    aria-label={`Ingresos de los últimos ${diasGrafica} días`}
                  >
                    <line x1="0" y1="142" x2="560" y2="142" stroke="rgba(201,162,74,0.25)" strokeWidth="1" />
                    {serie.map((v, i) => {
                      const alto = Math.round((v / maxSerie) * 100)
                      const x = Math.round(i * slot + (slot - barAncho) / 2)
                      const centro = Math.round(i * slot + slot / 2)
                      const esHoy = diasSerie[i] === hoy()
                      const d = new Date(diasSerie[i] + 'T12:00:00')
                      const conDetalle = diasGrafica <= 14
                      return (
                        <g key={diasSerie[i]}>
                          {v > 0 && conDetalle && (
                            <text x={centro} y={136 - alto} textAnchor="middle" fontSize="9.5" fill="#e3c57e">
                              {v.toLocaleString('es-UY')}
                            </text>
                          )}
                          <rect
                            x={x}
                            y={142 - Math.max(alto, v > 0 ? 4 : 0)}
                            width={barAncho}
                            height={Math.max(alto, v > 0 ? 4 : 0)}
                            rx="3"
                            fill={esHoy ? '#e3c57e' : '#c9a24a'}
                            opacity={v > 0 ? 0.95 : 0}
                          />
                          {v === 0 && (
                            <rect x={x} y={140} width={barAncho} height={2} rx="1" fill="rgba(201,162,74,0.18)" />
                          )}
                          {conDetalle ? (
                            <>
                              <text
                                x={centro}
                                y={158}
                                textAnchor="middle"
                                fontSize="9.5"
                                fontWeight={esHoy ? '700' : '400'}
                                fill={esHoy ? '#e3c57e' : '#b8b1a3'}
                              >
                                {LETRA_DIA[d.getDay()]}
                              </text>
                              <text x={centro} y={169} textAnchor="middle" fontSize="9" fill="#8a857b">
                                {diasSerie[i].slice(8, 10)}
                              </text>
                            </>
                          ) : (
                            (i % 3 === 0 || esHoy) && (
                              <text
                                x={centro}
                                y={158}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight={esHoy ? '700' : '400'}
                                fill={esHoy ? '#e3c57e' : '#8a857b'}
                              >
                                {diasSerie[i].slice(8, 10)}
                              </text>
                            )
                          )}
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>

              <div className="admin-grid">
                <div className="tabla-marco">
                  <h3>El mes por barbero</h3>
                  {porBarbero.map((b) => (
                    <div className="fila-barbero" key={b.id}>
                      <div className="fila-barbero-texto">
                        <span>{b.apodo || b.nombre}</span>
                        <strong>{plata(b.total)}</strong>
                      </div>
                      <div className="barra-pista">
                        <div className="barra" style={{ width: `${Math.round((b.total / maxBarbero) * 100)}%` }} />
                      </div>
                      <span className="fila-barbero-detalle">
                        {b.cantidad} {b.cantidad === 1 ? 'turno' : 'turnos'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="tabla-marco">
                  <h3>Servicios más pedidos del mes</h3>
                  {topServicios.length === 0 ? (
                    <p className="panel-vacio">Todavía no hay turnos este mes.</p>
                  ) : (
                    <table className="tabla-mes">
                      <tbody>
                        {topServicios.map(([id, n]) => (
                          <tr key={id}>
                            <td>{nombreServicio(id)}</td>
                            <td className="tabla-total">×{n}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ---------- Agenda ---------- */}
        <section className="panel-seccion">
          <div className="panel-seccion-head">
            <h2 className="panel-sub">Agenda</h2>
            <span className="panel-seccion-nota">
              {fechaLinda(fecha)} · {statDia.cantidad}{' '}
              {statDia.cantidad === 1 ? 'turno' : 'turnos'} · {plata(statDia.total)}
            </span>
          </div>

          <div className="panel-fecha">
            <button className="btn btn-outline btn-small" onClick={() => setFecha(moverDia(fecha, -1))}>
              ‹
            </button>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <button className="btn btn-outline btn-small" onClick={() => setFecha(moverDia(fecha, 1))}>
              ›
            </button>
            <button className="btn btn-outline btn-small" onClick={() => setFecha(hoy())}>
              Hoy
            </button>
          </div>

          {cargando ? (
            <p className="panel-vacio">Cargando turnos…</p>
          ) : visibles.length === 0 ? (
            <p className="panel-vacio">
              No hay turnos {filtro !== 'todos' ? `para ${nombreBarbero(filtro)} ` : ''}este día.
            </p>
          ) : (
            <ul className="panel-lista">
              {visibles.map((t) => (
                <li className="turno" key={t.id}>
                  <span className="turno-hora">{t.hora.slice(0, 5)}</span>
                  <div className="turno-datos">
                    <strong>{t.cliente_nombre}</strong>
                    <span>
                      {nombreServicio(t.servicio)} · con {nombreBarbero(t.barbero)}
                    </span>
                    <a href={`tel:${t.cliente_telefono}`}>{t.cliente_telefono}</a>
                  </div>
                  <span className="turno-precio">{plata(t.precio)}</span>
                  <button className="turno-cancelar" onClick={() => cancelar(t)}>
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- Registro de trabajos ---------- */}
        <section className="panel-seccion">
          <div className="panel-seccion-head">
            <h2 className="panel-sub">
              {esAdmin ? 'Registro de trabajos' : 'Tus trabajos realizados'}
            </h2>
            <span className="panel-seccion-nota">últimos {historialVisible.length}</span>
          </div>
          {gruposHistorial.length === 0 ? (
            <p className="panel-vacio">Todavía no hay trabajos registrados.</p>
          ) : (
            gruposHistorial.map((g) => (
              <div className="hist-grupo" key={g.fecha}>
                <h3 className="hist-fecha">{fechaLinda(g.fecha)}</h3>
                <ul className="panel-lista">
                  {g.items.map((t) => (
                    <li className="turno historial" key={t.id}>
                      <span className="turno-hora">{t.hora.slice(0, 5)}</span>
                      <div className="turno-datos">
                        <strong>{t.cliente_nombre}</strong>
                        <span>
                          {nombreServicio(t.servicio)}
                          {esAdmin ? ` · ${nombreBarbero(t.barbero)}` : ''}
                        </span>
                      </div>
                      <span className="turno-precio">{plata(t.precio)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
