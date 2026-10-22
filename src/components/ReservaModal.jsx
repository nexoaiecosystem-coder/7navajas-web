import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../lib/catalogo'
import { fotoServicio } from '../data/fotosServicios'
import { HORARIOS } from '../data/negocio'
import ImgFade from './ImgFade'

// fecha local (no UTC, que cambia de día a las 21:00 de Uruguay)
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const horaActual = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Horarios disponibles (cada 45 min) según el día de la semana
function slotsParaFecha(fechaStr) {
  if (!fechaStr) return []
  const dia = new Date(fechaStr + 'T12:00:00').getDay()
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

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Calendario propio: los días cerrados (o que ese barbero no atiende) no se pueden ni tocar
function Calendario({ fechaElegida, onElegir, diasNoLaborales = [] }) {
  const hoyStr = hoy()
  const hoyDate = new Date(hoyStr + 'T12:00:00')
  const base = fechaElegida ? new Date(fechaElegida + 'T12:00:00') : hoyDate
  const [mesVisible, setMesVisible] = useState(new Date(base.getFullYear(), base.getMonth(), 1))

  const primerDiaSemana = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay()
  const diasEnMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate()

  const fechaDe = (d) =>
    `${mesVisible.getFullYear()}-${String(mesVisible.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  function deshabilitado(d) {
    const fechaStr = fechaDe(d)
    if (fechaStr < hoyStr) return true
    const diaSemana = new Date(fechaStr + 'T12:00:00').getDay()
    if (!HORARIOS[diaSemana]) return true
    if (diasNoLaborales.includes(diaSemana)) return true
    if (fechaStr === hoyStr) {
      return !slotsParaFecha(fechaStr).some((s) => s > horaActual())
    }
    return false
  }

  const esMesActual =
    mesVisible.getFullYear() === hoyDate.getFullYear() && mesVisible.getMonth() === hoyDate.getMonth()

  const celdas = [...Array(primerDiaSemana).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]

  return (
    <div className="calendario">
      <div className="calendario-cabecera">
        <button
          type="button"
          className="calendario-mes-btn"
          disabled={esMesActual}
          onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <strong>
          {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
        </strong>
        <button
          type="button"
          className="calendario-mes-btn"
          onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>
      <div className="calendario-dias-semana">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="calendario-grilla">
        {celdas.map((d, i) =>
          d === null ? (
            <span key={i} className="calendario-celda vacia" />
          ) : (
            <button
              type="button"
              key={i}
              disabled={deshabilitado(d)}
              className={fechaDe(d) === fechaElegida ? 'calendario-celda activa' : 'calendario-celda'}
              onClick={() => onElegir(fechaDe(d))}
            >
              {d}
            </button>
          ),
        )}
      </div>
    </div>
  )
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
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [buscandoHoras, setBuscandoHoras] = useState(false)

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

  // Qué horas ya tiene ocupadas ese barbero ese día, para no ofrecerlas de nuevo
  useEffect(() => {
    if (!abierto || !supabase || !form.barbero || !form.fecha) {
      setHorasOcupadas([])
      return
    }
    let cancelado = false
    setBuscandoHoras(true)
    supabase
      .rpc('turnos_horas_ocupadas', { p_barbero: form.barbero, p_fecha: form.fecha })
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
  }, [abierto, form.barbero, form.fecha])

  if (!abierto) return null

  const servicioElegido = servicios.find((s) => s.id === form.servicio)
  const barberoElegido = barberos.find((b) => b.id === form.barbero)
  const datosListos = Boolean(usuario && form.nombre && form.telefono)

  // defensa extra: el calendario ya impide elegir estos días, esto es solo por las dudas
  const diaLibreBarbero =
    Boolean(form.fecha) &&
    (barberoElegido?.dias_no_laborales || []).includes(new Date(form.fecha + 'T12:00:00').getDay())
  const slots = diaLibreBarbero
    ? []
    : slotsParaFecha(form.fecha)
        .filter((s) => form.fecha !== hoy() || s > horaActual())
        .filter((s) => !horasOcupadas.includes(s))

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
      // el chequeo real y atómico lo hace la restricción única en la base de
      // datos (ver el catch del código 23505 más abajo): acá no hace falta
      // consultar antes, total la base rechaza el insert si ya está ocupado
      const { error: errorInsert } = await supabase.from('turnos').insert({
        cliente_nombre: form.nombre,
        cliente_telefono: form.telefono.replace(/\D/g, ''),
        barbero: form.barbero,
        servicio: form.servicio,
        precio: servicioElegido?.precio ?? 0,
        fecha: form.fecha,
        hora: form.hora,
      })
      if (errorInsert) {
        // 23505 = esa hora ya quedó ocupada justo ahora (lo bloqueó la base de datos)
        if (errorInsert.code === '23505') {
          setEstado({
            tipo: 'error',
            texto: 'Ese horario se acaba de ocupar. Elegí otra hora.',
          })
          setHorasOcupadas((h) => [...h, form.hora])
          setPaso('horario')
          setForm((f) => ({ ...f, hora: '' }))
          return
        }
        throw errorInsert
      }
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
                    <ImgFade src={fotoServicio(s)} alt="" />
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
                      <ImgFade className="op-foto-redonda" src={b.foto_url} alt="" />
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
                <Calendario
                  fechaElegida={form.fecha}
                  diasNoLaborales={barberoElegido?.dias_no_laborales}
                  onElegir={(f) => setForm((frm) => ({ ...frm, fecha: f, hora: '' }))}
                />
                {!form.fecha ? (
                  <p className="paso-nota">Elegí una fecha para ver los horarios libres.</p>
                ) : buscandoHoras ? (
                  <p className="paso-nota">Buscando horarios libres…</p>
                ) : slots.length === 0 ? (
                  <p className="paso-nota">No quedan horarios libres ese día. Probá otra fecha.</p>
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
