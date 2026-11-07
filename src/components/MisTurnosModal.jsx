import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../lib/catalogo'

// fecha local (no UTC, que cambia de día a las 21:00 de Uruguay)
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fechaLinda(fechaStr) {
  return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// estado de un pedido de corte extra (los turnos normales son siempre "confirmado")
function estadoExtra(t) {
  if (!t.es_extra) return null
  if (t.estado === 'solicitud_pendiente') return { texto: 'Pendiente de confirmación', clase: 'pendiente' }
  if (t.estado === 'rechazada') return { texto: 'No se pudo confirmar', clase: 'rechazada' }
  if (t.estado === 'vencida') return { texto: 'Venció sin respuesta', clase: 'vencida' }
  return { texto: 'Corte extra confirmado', clase: 'confirmada' }
}

const CICLO_FIDELIDAD = 6

export default function MisTurnosModal({ abierto, usuario, turnos, onReservar, onActualizar, onCerrar }) {
  const { servicios, barberos } = useCatalogo()
  const nombreServicio = (id) => servicios.find((s) => s.id === id)?.nombre || id
  const nombreBarbero = (id) => {
    const b = barberos.find((x) => x.id === id)
    return b ? b.apodo || b.nombre : id
  }
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!abierto) return
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
  }, [abierto, onCerrar])

  if (!abierto) return null

  const telefono = usuario?.user_metadata?.telefono || ''

  async function cancelar(t) {
    const seguro = window.confirm(
      `¿Cancelar tu turno del ${fechaLinda(t.fecha)} a las ${t.hora.slice(0, 5)}?`,
    )
    if (!seguro) return
    const { data: cancelado, error } = await supabase.rpc('turnos_cancelar', {
      p_id: t.id,
      p_telefono: telefono,
    })
    if (error || !cancelado) {
      setMsg({ tipo: 'error', texto: 'No se pudo cancelar el turno. Probá de nuevo.' })
      return
    }
    setMsg({ tipo: 'ok', texto: 'Turno cancelado. ¡Gracias por avisar!' })
    onActualizar?.()
  }

  function reservar() {
    onCerrar()
    onReservar?.()
  }

  // sin cuenta (no debería pasar: el botón que abre esto solo aparece con
  // sesión iniciada), pero por las dudas queda un mensaje claro
  if (!telefono) {
    return (
      <div
        className="modal-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCerrar()
        }}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-label="Mis turnos">
          <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
          <span className="section-tag">Tu cuenta</span>
          <h2 className="section-title">Mis turnos</h2>
          <p className="paso-nota">
            Completá tu teléfono en "Tu cuenta" para ver tus turnos y tu fidelidad acá.
          </p>
        </div>
      </div>
    )
  }

  const cargando = turnos === null
  const turnosProximos = (turnos || []).filter((t) => t.fecha >= hoy())
  const turnosPasados = (turnos || []).filter((t) => t.fecha < hoy())
  const asistencias = turnosPasados.filter((t) => t.estado === 'confirmado' && !t.no_asistio).length
  const enElCiclo = asistencias % CICLO_FIDELIDAD
  const circulosLlenos = enElCiclo === 0 && asistencias > 0 ? CICLO_FIDELIDAD : enElCiclo
  const corteGratisListo = circulosLlenos === CICLO_FIDELIDAD

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Mis turnos">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
        <span className="section-tag">Tu cuenta</span>
        <h2 className="section-title">Mis turnos</h2>

        {msg && <p className={`reserva-msg ${msg.tipo}`}>{msg.texto}</p>}

        {cargando ? (
          <p className="paso-nota">Buscando tus turnos…</p>
        ) : turnosProximos.length === 0 ? (
          <div className="mis-turnos-vacio">
            <p className="cancelar-vacio">Todavía no tenés turnos próximos agendados.</p>
            <button className="btn btn-primary btn-small" onClick={reservar}>
              Reservar turno
            </button>
          </div>
        ) : (
          <ul className="cancelar-lista">
            {turnosProximos.map((t) => {
              const estadoInfo = estadoExtra(t)
              const sePuedeCancelar = t.estado === 'confirmado' || t.estado === 'solicitud_pendiente'
              return (
                <li className="turno" key={t.id}>
                  <span className="turno-hora">{t.hora.slice(0, 5)}</span>
                  <div className="turno-datos">
                    <strong>{fechaLinda(t.fecha)}</strong>
                    <span>
                      {nombreServicio(t.servicio)} · con {nombreBarbero(t.barbero)}
                    </span>
                    {estadoInfo && (
                      <span className={`turno-estado-badge ${estadoInfo.clase}`}>{estadoInfo.texto}</span>
                    )}
                  </div>
                  {sePuedeCancelar && (
                    <button className="turno-cancelar" onClick={() => cancelar(t)}>
                      Cancelar
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="fidelidad">
          <h3 className="editor-titulo">Tu fidelidad</h3>
          <p className="paso-nota">
            {corteGratisListo
              ? '¡Completaste el ciclo! Tu próximo corte es gratis 🎉'
              : `Te ${CICLO_FIDELIDAD - circulosLlenos === 1 ? 'falta' : 'faltan'} ${CICLO_FIDELIDAD - circulosLlenos} ${CICLO_FIDELIDAD - circulosLlenos === 1 ? 'corte' : 'cortes'} para el corte gratis.`}
          </p>
          <div className="fidelidad-circulos">
            {Array.from({ length: CICLO_FIDELIDAD }, (_, i) => (
              <span
                key={i}
                className={i < circulosLlenos ? 'fidelidad-circulo lleno' : 'fidelidad-circulo'}
              >
                {i < circulosLlenos && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
          <p className="fidelidad-nota">
            Cada {CICLO_FIDELIDAD} cortes que vengas, el {CICLO_FIDELIDAD}° te sale gratis. Se
            suman cuando venís al turno y el barbero confirma tu asistencia.
          </p>
        </div>
      </div>
    </div>
  )
}
