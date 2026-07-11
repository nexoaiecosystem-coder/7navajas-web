import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BARBEROS, SERVICIOS, HORARIOS } from '../data/negocio'

// Genera los horarios disponibles (cada 30 min) según el día de la semana
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

const hoy = () => new Date().toISOString().slice(0, 10)

const FORM_VACIO = {
  nombre: '',
  telefono: '',
  barbero: '',
  servicio: '',
  fecha: '',
  hora: '',
}

export default function ReservaModal({ abierto, preseleccion, usuario, onCerrar }) {
  const [form, setForm] = useState(FORM_VACIO)
  const [estado, setEstado] = useState({ tipo: null, texto: '' })
  const [enviando, setEnviando] = useState(false)

  // Con sesión iniciada, nombre y teléfono vienen solos de la cuenta
  const datosDeCuenta = Boolean(
    usuario && usuario.user_metadata?.nombre && usuario.user_metadata?.telefono,
  )

  // Al abrir: precargar servicio/barbero (y datos de la cuenta), limpiar estado
  useEffect(() => {
    if (!abierto) return
    setForm({
      ...FORM_VACIO,
      nombre: usuario?.user_metadata?.nombre || '',
      telefono: usuario?.user_metadata?.telefono || '',
      ...(preseleccion || {}),
    })
    setEstado({ tipo: null, texto: '' })
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

  const slots = slotsParaFecha(form.fecha)

  const set = (campo) => (e) => {
    const valor = e.target.value
    setForm((f) => ({
      ...f,
      [campo]: valor,
      // si cambia la fecha, la hora elegida puede dejar de ser válida
      ...(campo === 'fecha' ? { hora: '' } : null),
    }))
  }

  async function enviar(e) {
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
      // Chequear que el turno no esté tomado para ese barbero/fecha/hora
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
          texto: 'Ese horario ya está reservado con ese barbero. Probá con otra hora.',
        })
        return
      }

      const { error: errorInsert } = await supabase.from('turnos').insert({
        cliente_nombre: form.nombre,
        // solo dígitos, para poder buscarlo después al cancelar
        cliente_telefono: form.telefono.replace(/\D/g, ''),
        barbero: form.barbero,
        servicio: form.servicio,
        precio: SERVICIOS.find((s) => s.id === form.servicio)?.precio ?? 0,
        fecha: form.fecha,
        hora: form.hora,
      })

      if (errorInsert) throw errorInsert

      const barbero = BARBEROS.find((b) => b.id === form.barbero)
      const [anio, mes, dia] = form.fecha.split('-')
      setEstado({
        tipo: 'ok',
        texto: `${dia}/${mes}/${anio} a las ${form.hora} con ${barbero ? barbero.apodo || barbero.nombre : 'el barbero elegido'}.`,
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

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Reservá tu turno">
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
            <span className="section-tag">Turnos online</span>
            <h2 className="section-title">Reservá tu turno</h2>
            <form className="reserva-form" onSubmit={enviar}>
              {datosDeCuenta ? (
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

              <div className="campos-row">
                <div className="campo">
                  <label htmlFor="r-servicio">Servicio</label>
                  <select id="r-servicio" required value={form.servicio} onChange={set('servicio')}>
                    <option value="">Elegí un servicio</option>
                    {SERVICIOS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} — ${s.precio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="r-barbero">Barbero</label>
                  <select id="r-barbero" required value={form.barbero} onChange={set('barbero')}>
                    <option value="">Elegí un barbero</option>
                    {BARBEROS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.apodo ? `${b.nombre} "${b.apodo}"` : b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="campos-row">
                <div className="campo">
                  <label htmlFor="r-fecha">Fecha</label>
                  <input
                    id="r-fecha"
                    type="date"
                    required
                    min={hoy()}
                    value={form.fecha}
                    onChange={set('fecha')}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="r-hora">Hora</label>
                  <select
                    id="r-hora"
                    required
                    value={form.hora}
                    onChange={set('hora')}
                    disabled={!form.fecha}
                  >
                    <option value="">
                      {!form.fecha
                        ? 'Elegí primero la fecha'
                        : slots.length === 0
                          ? 'Ese día está cerrado'
                          : 'Elegí una hora'}
                    </option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {estado.tipo === 'error' && (
                <p className="reserva-msg error">{estado.texto}</p>
              )}

              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Reservando…' : 'Confirmar reserva'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
