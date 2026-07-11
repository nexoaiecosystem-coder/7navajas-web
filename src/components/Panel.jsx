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

function rangoMes(fechaStr) {
  const [anio, mes] = fechaStr.split('-').map(Number)
  const ultimo = new Date(anio, mes, 0).getDate()
  return [`${fechaStr.slice(0, 8)}01`, `${fechaStr.slice(0, 8)}${String(ultimo).padStart(2, '0')}`]
}

const resumen = (filas) => ({
  cantidad: filas.length,
  total: filas.reduce((s, t) => s + (t.precio || 0), 0),
})

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

const fechaCorta = (fechaStr) => `${fechaStr.slice(8, 10)}/${fechaStr.slice(5, 7)}`

export default function Panel({ usuario, onCuenta }) {
  // acceso.estado: 'cargando' | 'sin-sesion' | 'sin-acceso' | 'ok'
  const [acceso, setAcceso] = useState({ estado: 'cargando', barbero: null, esAdmin: false })

  const [fecha, setFecha] = useState(hoy())
  const [tab, setTab] = useState('todos')
  const [turnos, setTurnos] = useState([])
  const [statsFilas, setStatsFilas] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(false)
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

  // Filas para estadísticas: semana + mes de la fecha elegida + últimos 14 días
  useEffect(() => {
    if (acceso.estado !== 'ok') return
    let vigente = true
    const [semIni, semFin] = rangoSemana(fecha)
    const [mesIni, mesFin] = rangoMes(fecha)
    const hace14 = moverDia(hoy(), -13)
    const desde = [semIni, mesIni, hace14].sort()[0]
    const hasta = [semFin, mesFin, hoy()].sort().slice(-1)[0]
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
      .limit(40)
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

  /* ---------- panel ---------- */

  const visibles = filtro === 'todos' ? turnos : turnos.filter((t) => t.barbero === filtro)
  const filasFiltradas =
    filtro === 'todos' ? statsFilas : statsFilas.filter((t) => t.barbero === filtro)

  const [semIni, semFin] = rangoSemana(fecha)
  const statDia = resumen(visibles)
  const statSemana = resumen(filasFiltradas.filter((t) => t.fecha >= semIni && t.fecha <= semFin))
  const statMes = resumen(filasFiltradas.filter((t) => t.fecha.slice(0, 7) === fecha.slice(0, 7)))

  // gráfica: ingresos por día, últimos 14 días
  const dias14 = Array.from({ length: 14 }, (_, i) => moverDia(hoy(), i - 13))
  const serie = dias14.map((f) => resumen(filasFiltradas.filter((t) => t.fecha === f)).total)
  const maxSerie = Math.max(...serie, 1)

  // tabla del mes por barbero (siempre todos: es la vista del dueño)
  const mesFilas = statsFilas.filter((t) => t.fecha.slice(0, 7) === fecha.slice(0, 7))
  const porBarbero = BARBEROS.map((b) => ({
    ...b,
    ...resumen(mesFilas.filter((t) => t.barbero === b.id)),
  }))

  // servicios más pedidos del mes
  const conteoServicios = {}
  for (const t of mesFilas) conteoServicios[t.servicio] = (conteoServicios[t.servicio] || 0) + 1
  const topServicios = Object.entries(conteoServicios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const historialVisible =
    esAdmin && filtro !== 'todos' ? historial.filter((t) => t.barbero === filtro) : historial

  return (
    <div className="panel">
      <div className="container">
        <header className="panel-head">
          <div>
            <span className="section-tag">
              {esAdmin ? 'Panel del dueño' : `Hola, ${nombreBarbero(acceso.barbero)}`}
            </span>
            <h1 className="section-title">{fechaLinda(fecha)}</h1>
          </div>
          <div className="panel-head-acciones">
            <button className="panel-salir" onClick={salir}>
              Cerrar sesión
            </button>
            <a className="panel-volver" href="#">
              ← Volver a la web
            </a>
          </div>
        </header>

        <div className="panel-controles">
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
                  {b.apodo || b.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="reserva-msg error">{error}</p>}

        <div className="panel-stats">
          <div className="stat">
            <span className="stat-label">Este día</span>
            <strong>${statDia.total}</strong>
            <span className="stat-detalle">
              {statDia.cantidad} {statDia.cantidad === 1 ? 'turno' : 'turnos'}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Semana</span>
            <strong>${statSemana.total}</strong>
            <span className="stat-detalle">
              {statSemana.cantidad} {statSemana.cantidad === 1 ? 'turno' : 'turnos'}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Mes</span>
            <strong>${statMes.total}</strong>
            <span className="stat-detalle">
              {statMes.cantidad} {statMes.cantidad === 1 ? 'turno' : 'turnos'}
            </span>
          </div>
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
                <span className="turno-precio">${t.precio}</span>
                <button className="turno-cancelar" onClick={() => cancelar(t)}>
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}

        {esAdmin && (
          <section className="panel-bloque">
            <h2 className="panel-sub">Resumen del negocio</h2>

            <div className="grafica-marco">
              <div className="grafica-titulo">
                <span>Ingresos · últimos 14 días{filtro !== 'todos' ? ` · ${nombreBarbero(filtro)}` : ''}</span>
                <strong>${serie.reduce((a, b) => a + b, 0)}</strong>
              </div>
              <svg
                className="grafica"
                viewBox="0 0 560 170"
                preserveAspectRatio="none"
                role="img"
                aria-label="Ingresos de los últimos 14 días"
              >
                <line x1="0" y1="140" x2="560" y2="140" stroke="rgba(201,162,74,0.25)" strokeWidth="1" />
                {serie.map((v, i) => {
                  const alto = Math.round((v / maxSerie) * 115)
                  const x = i * 40 + 6
                  return (
                    <g key={dias14[i]}>
                      <rect
                        x={x}
                        y={140 - alto}
                        width={28}
                        height={Math.max(alto, v > 0 ? 3 : 0)}
                        rx="3"
                        fill={i === 13 ? '#e3c57e' : '#c9a24a'}
                        opacity={v > 0 ? 0.95 : 0.15}
                      />
                      {v === 0 && <rect x={x} y={138} width={28} height={2} rx="1" fill="rgba(201,162,74,0.2)" />}
                      <text x={x + 14} y={158} textAnchor="middle" fontSize="10" fill="#b8b1a3">
                        {fechaCorta(dias14[i]).slice(0, 5)}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            <div className="admin-grid">
              <div className="tabla-marco">
                <h3>El mes por barbero</h3>
                <table className="tabla-mes">
                  <tbody>
                    {porBarbero.map((b) => (
                      <tr key={b.id}>
                        <td>{b.apodo || b.nombre}</td>
                        <td>{b.cantidad} turnos</td>
                        <td className="tabla-total">${b.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          </section>
        )}

        <section className="panel-bloque">
          <h2 className="panel-sub">
            {esAdmin ? 'Registro de trabajos' : 'Tus trabajos realizados'}
          </h2>
          {historialVisible.length === 0 ? (
            <p className="panel-vacio">Todavía no hay trabajos registrados.</p>
          ) : (
            <ul className="panel-lista">
              {historialVisible.map((t) => (
                <li className="turno historial" key={t.id}>
                  <span className="turno-hora">
                    {fechaCorta(t.fecha)}
                    <em>{t.hora.slice(0, 5)}</em>
                  </span>
                  <div className="turno-datos">
                    <strong>{t.cliente_nombre}</strong>
                    <span>
                      {nombreServicio(t.servicio)}
                      {esAdmin ? ` · ${nombreBarbero(t.barbero)}` : ''}
                    </span>
                  </div>
                  <span className="turno-precio">${t.precio}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
