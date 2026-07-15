import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../lib/catalogo'
import { fotoServicio } from '../data/fotosServicios'
import { HORARIOS } from '../data/negocio'

// fecha local (no UTC, que cambia de día a las 21:00 de Uruguay)
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const horaActual = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Horarios disponibles (cada 30 min) según el día de la semana
function slotsParaFecha(fechaStr) {
  if (!fechaStr) return []
  const dia = new Date(fechaStr + 'T12:00:00').getDay()
  const rango = HORARIOS[dia]
  if (!rango) return []
  const [desde, hasta] = rango
  const slots = []
  for (let h = desde; h < hasta; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

const plata = (n) => '$' + (n || 0).toLocaleString('es-UY')

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

function fechaLinda(fechaStr) {
  return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const ORDEN = ['servicio', 'barbero', 'horario', 'confirmar']
const TITULOS = {
  servicio: 'Elegí el servicio',
  barbero: '¿Con quién?',
  horario: 'Elegí día y hora',
  confirmar: 'Confirmá tu turno',
}

const FORM_VACIO = {
  nombre: '',
  telefono: '',
  barbero: '',
  servicio: '',
  fecha: '',
  hora: '',
}

export default function ReservaModal({ abierto, preseleccion, usuario, onCerrar }) {
  const { servicios, barberos } = useCatalogo()
  const [form, setForm] = useState(FORM_VACIO)
  const [paso, setPaso] = useState('servicio')
  const [estado, setEstado] = useState({ tipo: null, texto: '' })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setForm({
      ...FORM_VACIO,
      nombre: usuario?.user_metadata?.nombre || '',
      telefono: usuario?.user_metadata?.telefono || '',
      ...(preseleccion || {}),
    })
    setEstado({ tipo: null, texto: '' })
    setPaso(preseleccion?.servicio ? 'barbero' : 'servicio')
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [abierto, preseleccion, usuario, onCerrar])

  if (!abierto) return null

  const servicioElegido = servicios.find((s) => s.id === form.servicio)
  const barberoElegido = barberos.find((b) => b.id === form.barbero)
  const datosListos = Boolean(usuario && form.nombre && form.telefono)

  const diaCerrado = Boolean(form.fecha) && slotsParaFecha(form.fecha).length === 0
  const slots = slotsParaFecha(form.fecha).filter(
    (s) => form.fecha !== hoy() || s > horaActual(),
  )

  function elegirServicio(id) {
    setForm((f) => ({ ...f, servicio: id }))
    setPaso(form.barbero ? 'horario' : 'barbero')
  }

  function elegirBarbero(id) {
    setForm((f) => ({ ...f, barbero: id }))
    setPaso('horario')
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
      const { data: ocupados, error: errorConsulta } = await supabase
        .from('turnos')
        .select('id')
        .eq('barbero', form.barbero)
        .eq('fecha', form.fecha)
        .eq('hora', form.hora)
        .limit(1)
      if (errorConsulta) throw errorConsulta
      if (ocupados && ocupados.length > 0) {
        setEstado({
          tipo: 'error',
          texto: 'Ese horario se acaba de ocupar. Elegí otra hora.',
        })
        setPaso('horario')
        setForm((f) => ({ ...f, hora: '' }))
        return
      }
      const { error: errorInsert } = await supabase.from('turnos').insert({
        cliente_nombre: form.nombre,
        cliente_telefono: form.telefono.replace(/\D/g, ''),
        barbero: form.barbero,
        servicio: form.servicio,
        precio: servicioElegido?.precio ?? 0,
        fecha: form.fecha,
        hora: form.hora,
      })
      if (errorInsert) throw errorInsert
      const [anio, mes, dia] = form.fecha.split('-')
      setEstado({
        tipo: 'ok',
        texto: `${dia}/${mes}/${anio} a las ${form.hora} con ${barberoElegido ? barberoElegido.apodo || barberoElegido.nombre : 'el barbero elegido'}.`,
      })
    } catch (err) {
      console.error(err)
      setEstado({
        tipo: 'error',
        texto: 'Hubo un problema al guardar la reserva. Intentá de nuevo en un rato.',
      })
    } finally {
      setEnviando(false)
    }
  }

  const indicePaso = ORDEN.indexOf(paso)

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal modal-reserva" role="dialog" aria-modal="true" aria-label="Reservá tu turno">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        {estado.tipo === 'ok' ? (
          <div className="modal-exito">
            <div className="exito-icono">✓</div>
            <h2 className="section-title">¡Turno confirmado!</h2>
            <p className="exito-texto">
              {form.nombre}, te esperamos el {estado.texto}
            </p>
            <p className="exito-nota">
              Si no podés venir, cancelalo desde "Cancelar un turno" al pie de la página,
              con tu número de teléfono.
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

            <span className="section-tag">Turnos online</span>
            <h2 className="section-title">{TITULOS[paso]}</h2>

            {/* resumen de lo ya elegido */}
            {(servicioElegido || barberoElegido || form.hora) && paso !== 'confirmar' && (
              <div className="paso-elegidos">
                {servicioElegido && (
                  <button onClick={() => setPaso('servicio')}>
                    {servicioElegido.nombre} · {plata(servicioElegido.precio)}
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
                {servicios.map((s) => (
                  <button
                    key={s.id}
                    className={form.servicio === s.id ? 'op-servicio activo' : 'op-servicio'}
                    onClick={() => elegirServicio(s.id)}
                  >
                    <img src={fotoServicio(s)} alt="" loading="lazy" />
                    <span className="op-texto">
                      <strong>{s.nombre}</strong>
                      {s.nota && <em>{s.nota}</em>}
                    </span>
                    <span className="op-precio">{plata(s.precio)}</span>
                  </button>
                ))}
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
                    {b.foto_url ? (
                      <img className="op-foto-redonda" src={b.foto_url} alt="" loading="lazy" />
                    ) : (
                      <span className="op-avatar">{iniciales(b.nombre)}</span>
                    )}
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
                <div className="campo">
                  <label htmlFor="r-fecha">Fecha</label>
                  <input
                    id="r-fecha"
                    type="date"
                    required
                    min={hoy()}
                    value={form.fecha}
                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value, hora: '' }))}
                  />
                </div>
                {!form.fecha ? (
                  <p className="paso-nota">Elegí una fecha para ver los horarios libres.</p>
                ) : diaCerrado ? (
                  <p className="paso-nota">Ese día la barbería está cerrada. Probá con otro.</p>
                ) : slots.length === 0 ? (
                  <p className="paso-nota">Ya no quedan horarios hoy. Probá mañana.</p>
                ) : (
                  <div className="chips-horas">
                    {slots.map((s) => (
                      <button
                        key={s}
                        className={form.hora === s ? 'chip activo' : 'chip'}
                        onClick={() => elegirHora(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {paso === 'confirmar' && (
              <form className="reserva-form" onSubmit={confirmar}>
                <div className="resumen">
                  <button type="button" className="resumen-fila" onClick={() => setPaso('servicio')}>
                    <span>Servicio</span>
                    <strong>
                      {servicioElegido?.nombre} · {plata(servicioElegido?.precio)}
                    </strong>
                  </button>
                  <button type="button" className="resumen-fila" onClick={() => setPaso('barbero')}>
                    <span>Barbero</span>
                    <strong>{barberoElegido?.apodo || barberoElegido?.nombre}</strong>
                  </button>
                  <button type="button" className="resumen-fila" onClick={() => setPaso('horario')}>
                    <span>Cuándo</span>
                    <strong>
                      {form.fecha ? fechaLinda(form.fecha) : ''} · {form.hora}
                    </strong>
                  </button>
                </div>

                {datosListos ? (
                  <p className="reserva-como">
                    Reservando como <strong>{form.nombre}</strong> · {form.telefono}
                  </p>
                ) : (
                  <div className="campos-row">
                    <div className="campo">
                      <label htmlFor="r-nombre">Nombre</label>
                      <input
                        id="r-nombre"
                        type="text"
                        required
                        value={form.nombre}
                        onChange={set('nombre')}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="r-telefono">Teléfono</label>
                      <input
                        id="r-telefono"
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
                  {enviando ? 'Reservando…' : 'Confirmar reserva'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
