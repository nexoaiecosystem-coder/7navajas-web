import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BARBEROS, SERVICIOS } from '../data/negocio'

const hoy = () => new Date().toISOString().slice(0, 10)
const soloDigitos = (t) => t.replace(/\D/g, '')

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

export default function CancelarModal({ abierto, usuario, onCerrar }) {
  const [telefono, setTelefono] = useState('')
  const [turnos, setTurnos] = useState(null) // null = todavía no se buscó
  const [buscando, setBuscando] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!abierto) return
    // con sesión iniciada, el teléfono viene solo de la cuenta
    setTelefono(usuario?.user_metadata?.telefono || '')
    setTurnos(null)
    setMsg(null)
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

  if (!abierto) return null

  async function buscar(e) {
    e.preventDefault()
    setMsg(null)
    setBuscando(true)
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('cliente_telefono', soloDigitos(telefono))
      .gte('fecha', hoy())
      .order('fecha')
      .order('hora')
    setBuscando(false)
    if (error) {
      setMsg({ tipo: 'error', texto: 'No pudimos buscar tus turnos. Probá de nuevo.' })
      return
    }
    setTurnos(data || [])
  }

  async function cancelar(t) {
    const seguro = window.confirm(
      `¿Cancelar tu turno del ${fechaLinda(t.fecha)} a las ${t.hora.slice(0, 5)}?`,
    )
    if (!seguro) return
    const { error } = await supabase.from('turnos').delete().eq('id', t.id)
    if (error) {
      setMsg({ tipo: 'error', texto: 'No se pudo cancelar el turno. Probá de nuevo.' })
      return
    }
    setTurnos((lista) => lista.filter((x) => x.id !== t.id))
    setMsg({ tipo: 'ok', texto: 'Turno cancelado. El horario quedó libre, ¡gracias por avisar!' })
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Cancelar un turno">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
        <span className="section-tag">¿No podés venir?</span>
        <h2 className="section-title">Cancelar un turno</h2>
        <form className="reserva-form" onSubmit={buscar}>
          <div className="campo">
            <label htmlFor="c-telefono">Teléfono con el que reservaste</label>
            <input
              id="c-telefono"
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="099 123 456"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={buscando}>
            {buscando ? 'Buscando…' : 'Buscar mis turnos'}
          </button>
        </form>

        {msg && <p className={`reserva-msg ${msg.tipo}`}>{msg.texto}</p>}

        {turnos && turnos.length === 0 && !msg && (
          <p className="cancelar-vacio">
            No encontramos turnos próximos con ese teléfono. Fijate de escribirlo igual que
            cuando reservaste.
          </p>
        )}

        {turnos && turnos.length > 0 && (
          <ul className="cancelar-lista">
            {turnos.map((t) => (
              <li className="turno" key={t.id}>
                <span className="turno-hora">{t.hora.slice(0, 5)}</span>
                <div className="turno-datos">
                  <strong>{fechaLinda(t.fecha)}</strong>
                  <span>
                    {nombreServicio(t.servicio)} · con {nombreBarbero(t.barbero)}
                  </span>
                </div>
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
