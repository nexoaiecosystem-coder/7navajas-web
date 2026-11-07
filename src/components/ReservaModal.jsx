import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../lib/catalogo'
import { fotoServicio } from '../data/fotosServicios'
import { HORARIOS, SLOTS_EXTRA, CICLO_FIDELIDAD } from '../data/negocio'
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

// Horarios "extra" fuera de hora normal: 4 turnos de 45 min arrancando
// justo en el cierre de ese día (cualquier día que la barbería trabaje)
function slotsExtraParaFecha(fechaStr) {
  if (!fechaStr) return []
  const dia = new Date(fechaStr + 'T12:00:00').getDay()
  const rango = HORARIOS[dia]
  if (!rango) return []
  const [, cierre] = rango
  const slots = []
  for (let i = 0; i < SLOTS_EXTRA; i++) {
    const m = cierre * 60 + i * 45
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return slots
}

// Momento en que una solicitud extra vence sola si el barbero no responde:
// al terminar la ventana extra de ese día (el último de los SLOTS_EXTRA)
function venceDe(fechaStr) {
  const dia = new Date(fechaStr + 'T12:00:00').getDay()
  const rango = HORARIOS[dia]
  const cierre = rango ? rango[1] : 20
  const finMin = cierre * 60 + SLOTS_EXTRA * 45
  const h = Math.floor(finMin / 60)
  const min = finMin % 60
  return new Date(`${fechaStr}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`).toISOString()
}

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Calendario propio: los días cerrados (o que ese barbero no atiende) no se pueden ni tocar
function Calendario({ fechaElegida, onElegir, diasNoLaborales = [], incluirExtra = false }) {
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
      const disponibles = slotsParaFecha(fechaStr).concat(incluirExtra ? slotsExtraParaFecha(fechaStr) : [])
      return !disponibles.some((s) => s > horaActual())
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
  const { servicios, barberos, recargoExtra, extraActivo } = useCatalogo()
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

  // Fidelidad: cuántos cortes confirmados lleva ese teléfono (para avisar,
  // antes de confirmar, si este turno le va a salir gratis). El precio real
  // se recalcula de nuevo justo antes de guardar, por las dudas.
  const [cicloFidelidad, setCicloFidelidad] = useState(null)
  useEffect(() => {
    const telefonoDigitos = form.telefono.replace(/\D/g, '')
    if (!abierto || paso !== 'confirmar' || !supabase || telefonoDigitos.length < 8) {
      setCicloFidelidad(null)
      return
    }
    let cancelado = false
    supabase
      .rpc('turnos_por_telefono', { p_telefono: telefonoDigitos, p_desde: '2000-01-01' })
      .then(({ data, error }) => {
        if (cancelado || error) return
        setCicloFidelidad((data || []).filter((t) => t.estado === 'confirmado' && !t.no_asistio).length)
      })
    return () => {
      cancelado = true
    }
  }, [abierto, paso, form.telefono])

  if (!abierto) return null

  const servicioElegido = servicios.find((s) => s.id === form.servicio)
  const barberoElegido = barberos.find((b) => b.id === form.barbero)
  const datosListos = Boolean(usuario && form.nombre && form.telefono)
  const precioConRecargo = (base) => Math.round((base || 0) * (1 + recargoExtra / 100))

  // defensa extra: el calendario ya impide elegir estos días, esto es solo por las dudas
  const diaLibreBarbero =
    Boolean(form.fecha) &&
    (barberoElegido?.dias_no_laborales || []).includes(new Date(form.fecha + 'T12:00:00').getDay())
  const enElPasado = (s) => form.fecha === hoy() && s <= horaActual()
  const horasNormales = diaLibreBarbero
    ? []
    : slotsParaFecha(form.fecha)
        .filter((s) => !enElPasado(s))
        .filter((s) => !horasOcupadas.includes(s))
  // los horarios extra (fuera de hora, con recargo) solo si el interruptor general
  // está activo y además el servicio elegido los admite
  const horasExtra =
    !extraActivo || diaLibreBarbero || !servicioElegido?.disponible_extra
      ? []
      : slotsExtraParaFecha(form.fecha)
          .filter((s) => !enElPasado(s))
          .filter((s) => !horasOcupadas.includes(s))
  const esHoraExtra = horasExtra.includes(form.hora)
  const esSextoGratis = cicloFidelidad !== null && (cicloFidelidad + 1) % CICLO_FIDELIDAD === 0

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
    // se guarda antes de insertar: después del insert, si llega a pasar la
    // hora elegida mientras se arma la respuesta, "esHoraExtra" recalculado
    // podría dar otro resultado y mostrar el cartel equivocado
    const eraExtra = esHoraExtra
    try {
      // la fidelidad se recalcula de nuevo acá, fresca, justo antes de
      // guardar: lo que se mostró antes en el resumen es solo un adelanto
      const telefonoDigitos = form.telefono.replace(/\D/g, '')
      let eraSextoGratis = false
      const { data: historial } = await supabase.rpc('turnos_por_telefono', {
        p_telefono: telefonoDigitos,
        p_desde: '2000-01-01',
      })
      if (historial) {
        const confirmados = historial.filter((t) => t.estado === 'confirmado' && !t.no_asistio).length
        eraSextoGratis = (confirmados + 1) % CICLO_FIDELIDAD === 0
      }
      const precioBase = eraExtra ? precioConRecargo(servicioElegido?.precio) : (servicioElegido?.precio ?? 0)

      // el chequeo real y atómico lo hace la restricción única en la base de
      // datos (ver el catch del código 23505 más abajo): acá no hace falta
      // consultar antes, total la base rechaza el insert si ya está ocupado
      const { error: errorInsert } = await supabase.from('turnos').insert({
        cliente_nombre: form.nombre,
        cliente_telefono: telefonoDigitos,
        barbero: form.barbero,
        servicio: form.servicio,
        precio: eraSextoGratis ? 0 : precioBase,
        fecha: form.fecha,
        hora: form.hora,
        ...(eraExtra
          ? { es_extra: true, estado: 'solicitud_pendiente', vence_at: venceDe(form.fecha) }
          : {}),
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
      const nombreB = barberoElegido ? barberoElegido.apodo || barberoElegido.nombre : 'el barbero elegido'
      setEstado({
        tipo: 'ok',
        esExtra: eraExtra,
        esGratis: eraSextoGratis,
        texto: eraExtra
          ? `${dia}/${mes}/${anio} a las ${form.hora}.`
          : `${dia}/${mes}/${anio} a las ${form.hora} con ${nombreB}.`,
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
            <h2 className="section-title">
              {estado.esExtra ? '¡Pedido enviado!' : '¡Turno confirmado!'}
            </h2>
            <p className="exito-texto">
              {estado.esExtra
                ? `${form.nombre}, le avisamos a ${barberoElegido ? barberoElegido.apodo || barberoElegido.nombre : 'tu barbero'} que querés venir el ${estado.texto}`
                : `${form.nombre}, te esperamos el ${estado.texto}`}
            </p>
            <p className="exito-nota">
              {estado.esExtra
                ? 'Ese horario es fuera de hora, así que todavía no está confirmado: tiene que aceptarlo el barbero. Fijate si lo confirmó buscando tu turno con tu teléfono en "Cancelar un turno", al pie de la página.'
                : 'Si no podés venir, cancelalo desde "Cancelar un turno" al pie de la página, con tu número de teléfono.'}
            </p>
            {estado.esGratis && (
              <p className="exito-gratis">🎉 ¡Completaste tu fidelidad! Este corte te sale gratis.</p>
            )}
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
                  incluirExtra={Boolean(extraActivo && servicioElegido?.disponible_extra)}
                  onElegir={(f) => setForm((frm) => ({ ...frm, fecha: f, hora: '' }))}
                />
                {!form.fecha ? (
                  <p className="paso-nota">Elegí una fecha para ver los horarios libres.</p>
                ) : buscandoHoras ? (
                  <p className="paso-nota">Buscando horarios libres…</p>
                ) : horasNormales.length === 0 && horasExtra.length === 0 ? (
                  <p className="paso-nota">No quedan horarios libres ese día. Probá otra fecha.</p>
                ) : (
                  <>
                    <div className="chips-horas">
                      {horasNormales.map((s) => (
                        <button
                          key={s}
                          className={form.hora === s ? 'chip activo' : 'chip'}
                          onClick={() => elegirHora(s)}
                        >
                          {s}
                        </button>
                      ))}
                      {horasExtra.map((s) => (
                        <button
                          key={s}
                          className={form.hora === s ? 'chip chip-extra activo' : 'chip chip-extra'}
                          onClick={() => elegirHora(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {horasExtra.length > 0 && (
                      <p className="paso-nota">
                        Los horarios en rojo son fuera de hora normal, con un recargo del{' '}
                        {recargoExtra}%. El barbero tiene que confirmarlos: no son una reserva
                        asegurada.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {paso === 'confirmar' && (
              <form className="reserva-form" onSubmit={confirmar}>
                <div className="resumen">
                  <button type="button" className="resumen-fila" onClick={() => setPaso('servicio')}>
                    <span>Servicio</span>
                    <strong>
                      {servicioElegido?.nombre} ·{' '}
                      {esSextoGratis ? (
                        <span className="resumen-gratis">GRATIS 🎉</span>
                      ) : (
                        plata(esHoraExtra ? precioConRecargo(servicioElegido?.precio) : servicioElegido?.precio)
                      )}
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
                      {esHoraExtra && ' (fuera de hora)'}
                    </strong>
                  </button>
                </div>

                {esHoraExtra && (
                  <p className="paso-nota">
                    Esto no queda confirmado al toque: el barbero tiene que aceptar tu pedido.
                  </p>
                )}

                {esSextoGratis && (
                  <p className="paso-nota resumen-gratis-nota">
                    🎉 ¡Completaste tu fidelidad! Este corte te sale gratis.
                  </p>
                )}

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
                  {esHoraExtra
                    ? enviando
                      ? 'Enviando…'
                      : 'Enviar pedido'
                    : enviando
                      ? 'Reservando…'
                      : 'Confirmar reserva'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
