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

export default function Reserva({ preseleccion }) {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    barbero: '',
    servicio: '',
    fecha: '',
    hora: '',
  })
  const [estado, setEstado] = useState({ tipo: null, texto: '' })
  const [enviando, setEnviando] = useState(false)

  // Cuando tocan "reservar este servicio" / "reservar con X" se precarga acá
  useEffect(() => {
    if (!preseleccion) return
    setForm((f) => ({ ...f, ...preseleccion }))
  }, [preseleccion])

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
        nombre: form.nombre,
        telefono: form.telefono,
        barbero: form.barbero,
        servicio: form.servicio,
        fecha: form.fecha,
        hora: form.hora,
      })

      if (errorInsert) throw errorInsert

      const barbero = BARBEROS.find((b) => b.id === form.barbero)
      setEstado({
        tipo: 'ok',
        texto: `¡Listo, ${form.nombre}! Tu turno quedó reservado para el ${form.fecha} a las ${form.hora} con ${barbero ? barbero.apodo || barbero.nombre : 'el barbero elegido'}.`,
      })
      setForm({ nombre: '', telefono: '', barbero: '', servicio: '', fecha: '', hora: '' })
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
    <section id="reserva">
      <div className="container">
        <span className="section-tag">Turnos online</span>
        <h2 className="section-title">Reservá tu turno</h2>
        <form className="reserva-form" onSubmit={enviar}>
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
              <select id="r-hora" required value={form.hora} onChange={set('hora')} disabled={!form.fecha}>
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

          {estado.tipo && <p className={`reserva-msg ${estado.tipo}`}>{estado.texto}</p>}

          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Reservando…' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    </section>
  )
}
