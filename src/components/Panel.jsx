import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BARBEROS, SERVICIOS, PANEL_CLAVE } from '../data/negocio'

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

function fechaLinda(fechaStr) {
  return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const nombreServicio = (id) => SERVICIOS.find((s) => s.id === id)?.nombre || id
const nombreBarbero = (id) => {
  const b = BARBEROS.find((x) => x.id === id)
  return b ? b.apodo || b.nombre : id
}

export default function Panel() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('panel7n') === 'ok')
  const [clave, setClave] = useState('')
  const [claveError, setClaveError] = useState(false)

  const [fecha, setFecha] = useState(hoy())
  const [barbero, setBarbero] = useState('todos')
  const [turnos, setTurnos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [refresco, setRefresco] = useState(0)
  const [statsFilas, setStatsFilas] = useState([])

  // Filas de la semana y el mes de la fecha elegida, para las estadísticas
  useEffect(() => {
    if (!auth || !supabase) return
    let vigente = true
    const [semIni, semFin] = rangoSemana(fecha)
    const [mesIni, mesFin] = rangoMes(fecha)
    const desde = semIni < mesIni ? semIni : mesIni
    const hasta = semFin > mesFin ? semFin : mesFin
    supabase
      .from('turnos')
      .select('barbero, precio, fecha')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .then(({ data }) => {
        if (vigente) setStatsFilas(data || [])
      })
    return () => {
      vigente = false
    }
  }, [auth, fecha, refresco])

  useEffect(() => {
    if (!auth) return
    if (!supabase) {
      setError('Supabase no está configurado.')
      return
    }
    // "vigente" evita que una respuesta vieja pise a una más nueva
    // si el barbero cambia de fecha rápido
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
        if (err) {
          setError('No se pudieron cargar los turnos. Probá de nuevo.')
        } else {
          setTurnos(data || [])
        }
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [auth, fecha, refresco])

  function entrar(e) {
    e.preventDefault()
    if (clave === PANEL_CLAVE) {
      sessionStorage.setItem('panel7n', 'ok')
      setAuth(true)
    } else {
      setClaveError(true)
    }
  }

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
    setRefresco((n) => n + 1)
  }

  if (!auth) {
    return (
      <div className="panel">
        <div className="panel-login">
          <span className="section-tag">Solo barberos</span>
          <h1 className="section-title">Panel de turnos</h1>
          <form onSubmit={entrar} className="reserva-form">
            <div className="campo">
              <label htmlFor="p-clave">Clave de acceso</label>
              <input
                id="p-clave"
                type="password"
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value)
                  setClaveError(false)
                }}
                placeholder="••••"
                autoFocus
              />
            </div>
            {claveError && <p className="reserva-msg error">Clave incorrecta.</p>}
            <button type="submit" className="btn btn-primary">
              Entrar
            </button>
          </form>
          <a className="panel-volver" href="#">
            ← Volver a la web
          </a>
        </div>
      </div>
    )
  }

  const visibles = barbero === 'todos' ? turnos : turnos.filter((t) => t.barbero === barbero)

  const [semIni, semFin] = rangoSemana(fecha)
  const filasFiltradas =
    barbero === 'todos' ? statsFilas : statsFilas.filter((t) => t.barbero === barbero)
  const statDia = resumen(visibles)
  const statSemana = resumen(filasFiltradas.filter((t) => t.fecha >= semIni && t.fecha <= semFin))
  const statMes = resumen(filasFiltradas.filter((t) => t.fecha.slice(0, 7) === fecha.slice(0, 7)))

  return (
    <div className="panel">
      <div className="container">
        <header className="panel-head">
          <div>
            <span className="section-tag">Panel de turnos</span>
            <h1 className="section-title">{fechaLinda(fecha)}</h1>
          </div>
          <a className="panel-volver" href="#">
            ← Volver a la web
          </a>
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
          <div className="panel-tabs">
            <button
              className={barbero === 'todos' ? 'activo' : ''}
              onClick={() => setBarbero('todos')}
            >
              Todos
            </button>
            {BARBEROS.map((b) => (
              <button
                key={b.id}
                className={barbero === b.id ? 'activo' : ''}
                onClick={() => setBarbero(b.id)}
              >
                {b.apodo || b.nombre}
              </button>
            ))}
          </div>
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
            No hay turnos {barbero !== 'todos' ? `para ${nombreBarbero(barbero)} ` : ''}este día.
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
      </div>
    </div>
  )
}
