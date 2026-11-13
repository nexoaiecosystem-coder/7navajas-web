import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../lib/catalogo'
import { HORARIOS, NOMBRES_DIA } from '../data/negocio'

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

const plata = (n) => '$' + (n || 0).toLocaleString('es-UY')

// Horarios disponibles (cada 45 min) para un día de la semana fijo
function slotsParaDia(dia) {
  const rango = HORARIOS[dia]
  if (!rango) return []
  const [desde, hasta] = rango
  const slots = []
  for (let m = desde * 60; m < hasta * 60; m += 45) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return slots
}

const ORDEN = ['servicio', 'barbero', 'horario', 'confirmar']
const TITULOS = {
  servicio: 'Elegí el servicio',
  barbero: '¿Con quién?',
  horario: 'Elegí tu día y hora fija',
  confirmar: 'Confirmá tu membresía',
}

const FORM_VACIO = {
  nombre: '',
  telefono: '',
  barbero: '',
  servicio: '',
  diaSemana: null,
  hora: '',
}

export default function MembresiaModal({ abierto, usuario, onCerrar }) {
  const { servicios, barberos } = useCatalogo()
  const serviciosConMembresia = servicios.filter((s) => s.precio_mensual)
  const [form, setForm] = useState(FORM_VACIO)
  const [paso, setPaso] = useState('servicio')
  const [estado, setEstado] = useState({ tipo: null, texto: '' })
  const [enviando, setEnviando] = useState(false)
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [buscandoHoras, setBuscandoHoras] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setForm({
      ...FORM_VACIO,
      nombre: usuario?.user_metadata?.nombre || '',
      telefono: usuario?.user_metadata?.telefono || '',
    })
    setEstado({ tipo: null, texto: '' })
    setPaso('servicio')
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [abierto, usuario, onCerrar])

  // Qué horas ya tiene tomadas ese barbero ese día de la semana por otra
  // membresía activa (el horario queda ocupado siempre, no solo esa semana)
  useEffect(() => {
    if (!abierto || !supabase || !form.barbero || form.diaSemana === null) {
      setHorasOcupadas([])
      return
    }
    let cancelado = false
    setBuscandoHoras(true)
    supabase
      .rpc('membresias_horas_ocupadas', { p_barbero: form.barbero, p_dia_semana: form.diaSemana })
      .then(({ data, error }) => {
        if (cancelado) return
        if (!error) {
          setHorasOcupadas((data || []).map((t) => (typeof t === 'string' ? t : t.hora).slice(0, 5)))
        }
        setBuscandoHoras(false)
      })
      .catch(() => {
        if (!cancelado) setBuscandoHoras(false)
      })
    return () => {
      cancelado = true
    }
  }, [abierto, form.barbero, form.diaSemana])

  if (!abierto) return null

  const servicioElegido = serviciosConMembresia.find((s) => s.id === form.servicio)
  const barberoElegido = barberos.find((b) => b.id === form.barbero)
  const datosListos = Boolean(usuario && form.nombre && form.telefono)

  const diasDisponibles = HORARIOS.map((rango, dia) => ({ dia, rango }))
    .filter(({ rango, dia }) => rango && !(barberoElegido?.dias_no_laborales || []).includes(dia))
  const horasDelDia = form.diaSemana === null
    ? []
    : slotsParaDia(form.diaSemana).filter((h) => !horasOcupadas.includes(h))

  function elegirServicio(id) {
    setForm((f) => ({ ...f, servicio: id }))
    setPaso(form.barbero ? 'horario' : 'barbero')
  }

  function elegirBarbero(id) {
    setForm((f) => ({ ...f, barbero: id }))
    setPaso('horario')
  }

  function elegirDia(dia) {
    setForm((f) => ({ ...f, diaSemana: dia, hora: '' }))
  }

  function elegirHora(h) {
    setForm((f) => ({ ...f, hora: h }))
    setPaso('confirmar')
  }

  function atras() {
    const i = ORDEN.indexOf(paso)
    if (i > 0) setPaso(ORDEN[i - 1])
  }

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function confirmar(e) {
    e.preventDefault()
    setEstado({ tipo: null, texto: '' })
    if (!supabase) {
      setEstado({
        tipo: 'error',
        texto: 'El sistema de reservas no está configurado todavía. Escribinos por Instagram.',
      })
      return
    }
    setEnviando(true)
    try {
      const telefonoDigitos = form.telefono.replace(/\D/g, '')
      const { error: errorAlta } = await supabase.rpc('membresia_crear', {
        p_cliente_nombre: form.nombre,
        p_cliente_telefono: telefonoDigitos,
        p_barbero: form.barbero,
        p_servicio: form.servicio,
        p_dia_semana: form.diaSemana,
        p_hora: form.hora,
      })
      if (errorAlta) throw errorAlta
      setEstado({ tipo: 'ok', texto: '' })
    } catch (err) {
      console.error(err)
      setEstado({
        tipo: 'error',
        texto: 'Hubo un problema al activar la membresía. Intentá de nuevo en un rato.',
      })
    } finally {
      setEnviando(false)
    }
  }

  const indicePaso = ORDEN.indexOf(paso)
  const nombreB = barberoElegido ? barberoElegido.apodo || barberoElegido.nombre : 'tu barbero'

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal modal-reserva" role="dialog" aria-modal="true" aria-label="Membresía mensual">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        {estado.tipo === 'ok' ? (
          <div className="modal-exito">
            <div className="exito-icono">✓</div>
            <h2 className="section-title">¡Membresía activada!</h2>
            <p className="exito-texto">
              {form.nombre}, quedó reservado tu lugar todos los{' '}
              <strong>{NOMBRES_DIA[form.diaSemana]}</strong> a las <strong>{form.hora}</strong> con{' '}
              {nombreB}.
            </p>
            <p className="exito-nota">
              El cobro de {plata(servicioElegido?.precio_mensual)} por mes se hace en el local, como
              siempre. La membresía se renueva sola cada mes: si en algún momento no la vas a usar
              más, cancelala desde "Mis turnos" o "Cancelar un turno" para liberar el horario.
            </p>
            <button className="btn btn-primary" onClick={onCerrar}>
              Listo
            </button>
          </div>
        ) : (
          <>
            <div className="paso-cabecera">
              {indicePaso > 0 ? (
                <button className="paso-atras" onClick={atras} aria-label="Volver">
                  ‹
                </button>
              ) : (
                <span className="paso-atras vacio" />
              )}
              <div className="paso-puntos" aria-hidden="true">
                {ORDEN.map((p, i) => (
                  <span key={p} className={i <= indicePaso ? 'punto activo' : 'punto'} />
                ))}
              </div>
            </div>

            <span className="section-tag">Membresía mensual</span>
            <h2 className="section-title">{TITULOS[paso]}</h2>

            {(servicioElegido || barberoElegido) && paso !== 'confirmar' && (
              <div className="paso-elegidos">
                {servicioElegido && (
                  <button onClick={() => setPaso('servicio')}>
                    {servicioElegido.nombre} · {plata(servicioElegido.precio_mensual)}/mes
                  </button>
                )}
                {barberoElegido && (
                  <button onClick={() => setPaso('barbero')}>
                    {barberoElegido.apodo || barberoElegido.nombre}
                  </button>
                )}
              </div>
            )}

            {paso === 'servicio' && (
              <div className="op-lista">
                {serviciosConMembresia.length === 0 ? (
                  <p className="paso-nota">Todavía no hay servicios con membresía disponible.</p>
                ) : (
                  serviciosConMembresia.map((s) => (
                    <button
                      key={s.id}
                      className={form.servicio === s.id ? 'op-servicio activo' : 'op-servicio'}
                      onClick={() => elegirServicio(s.id)}
                    >
                      <span className="op-texto">
                        <strong>{s.nombre}</strong>
                        <em>una vez por semana, todo el mes</em>
                      </span>
                      <span className="op-precio">{plata(s.precio_mensual)}/mes</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {paso === 'barbero' && (
              <div className="op-lista">
                {barberos.map((b) => (
                  <button
                    key={b.id}
                    className={form.barbero === b.id ? 'op-servicio activo' : 'op-servicio'}
                    onClick={() => elegirBarbero(b.id)}
                  >
                    <span className="op-avatar">{iniciales(b.nombre)}</span>
                    <span className="op-texto">
                      <strong>{b.nombre}</strong>
                      {b.apodo && <em>"{b.apodo}"</em>}
                    </span>
                    <span className="op-precio flecha">›</span>
                  </button>
                ))}
              </div>
            )}

            {paso === 'horario' && (
              <div className="paso-horario">
                <p className="paso-nota">
                  Elegí el día de la semana y la hora: van a quedar reservados para vos todas las
                  semanas, de forma fija.
                </p>
                <div className="chips-horas">
                  {diasDisponibles.map(({ dia }) => (
                    <button
                      key={dia}
                      type="button"
                      className={form.diaSemana === dia ? 'chip activo' : 'chip'}
                      onClick={() => elegirDia(dia)}
                    >
                      {NOMBRES_DIA[dia]}
                    </button>
                  ))}
                </div>
                {form.diaSemana !== null && (
                  buscandoHoras ? (
                    <p className="paso-nota">Buscando horarios libres…</p>
                  ) : horasDelDia.length === 0 ? (
                    <p className="paso-nota">No quedan horarios libres fijos ese día. Probá otro día.</p>
                  ) : (
                    <div className="chips-horas">
                      {horasDelDia.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={form.hora === s ? 'chip activo' : 'chip'}
                          onClick={() => elegirHora(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {paso === 'confirmar' && (
              <form className="reserva-form" onSubmit={confirmar}>
                <div className="resumen">
                  <button type="button" className="resumen-fila" onClick={() => setPaso('servicio')}>
                    <span>Servicio</span>
                    <strong>
                      {servicioElegido?.nombre} · {plata(servicioElegido?.precio_mensual)}/mes
                    </strong>
                  </button>
                  <button type="button" className="resumen-fila" onClick={() => setPaso('barbero')}>
                    <span>Barbero</span>
                    <strong>{barberoElegido?.apodo || barberoElegido?.nombre}</strong>
                  </button>
                  <button type="button" className="resumen-fila" onClick={() => setPaso('horario')}>
                    <span>Cuándo</span>
                    <strong>
                      Todos los {NOMBRES_DIA[form.diaSemana]} a las {form.hora}
                    </strong>
                  </button>
                </div>

                <p className="paso-nota">
                  Ese día y esa hora van a quedar reservados para vos, todas las semanas, mientras
                  la membresía esté activa. La podés cancelar cuando quieras.
                </p>

                {datosListos ? (
                  <p className="reserva-como">
                    Reservando como <strong>{form.nombre}</strong> · {form.telefono}
                  </p>
                ) : (
                  <div className="campos-row">
                    <div className="campo">
                      <label htmlFor="m-nombre">Nombre</label>
                      <input
                        id="m-nombre"
                        type="text"
                        required
                        value={form.nombre}
                        onChange={set('nombre')}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="m-telefono">Teléfono</label>
                      <input
                        id="m-telefono"
                        type="tel"
                        required
                        value={form.telefono}
                        onChange={set('telefono')}
                        placeholder="099 123 456"
                      />
                    </div>
                  </div>
                )}

                {estado.tipo === 'error' && <p className="reserva-msg error">{estado.texto}</p>}

                <button type="submit" className="btn btn-primary" disabled={enviando}>
                  {enviando ? 'Activando…' : 'Activar membresía'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
