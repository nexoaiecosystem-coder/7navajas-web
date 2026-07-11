import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FORM_VACIO = { nombre: '', telefono: '', email: '', password: '' }

export default function CuentaModal({ abierto, usuario, onCerrar }) {
  const [modo, setModo] = useState('ingresar') // 'ingresar' | 'crear'
  const [form, setForm] = useState(FORM_VACIO)
  const [msg, setMsg] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setMsg(null)
    setModo('ingresar')
    setForm(
      usuario
        ? {
            nombre: usuario.user_metadata?.nombre || '',
            telefono: usuario.user_metadata?.telefono || '',
            email: usuario.email || '',
            password: '',
          }
        : FORM_VACIO,
    )
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

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function ingresar(e) {
    e.preventDefault()
    setCargando(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setCargando(false)
    if (error) {
      setMsg({ tipo: 'error', texto: 'Email o contraseña incorrectos.' })
    } else {
      onCerrar()
    }
  }

  async function crear(e) {
    e.preventDefault()
    setCargando(true)
    setMsg(null)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          telefono: form.telefono.replace(/\D/g, ''),
        },
      },
    })
    setCargando(false)
    if (error) {
      setMsg({
        tipo: 'error',
        texto: error.message.toLowerCase().includes('already')
          ? 'Ya existe una cuenta con ese email. Probá ingresar.'
          : 'No se pudo crear la cuenta: ' + error.message,
      })
      return
    }
    if (data.session) {
      setMsg({ tipo: 'ok', texto: '¡Cuenta creada! Ya podés reservar sin cargar tus datos.' })
      setTimeout(onCerrar, 1200)
    } else {
      setMsg({
        tipo: 'ok',
        texto: 'Te mandamos un correo para confirmar la cuenta. Abrí el link y después ingresá.',
      })
    }
  }

  async function conGoogle() {
    setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    })
    if (error) {
      setMsg({ tipo: 'error', texto: 'El ingreso con Google no está disponible todavía.' })
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setCargando(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({
      data: { nombre: form.nombre, telefono: form.telefono.replace(/\D/g, '') },
    })
    setCargando(false)
    setMsg(
      error
        ? { tipo: 'error', texto: 'No se pudieron guardar los cambios.' }
        : { tipo: 'ok', texto: 'Datos guardados.' },
    )
  }

  async function salir() {
    await supabase.auth.signOut()
    onCerrar()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Tu cuenta">
        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        {usuario ? (
          <>
            <span className="section-tag">Tu cuenta</span>
            <h2 className="section-title">
              Hola, {usuario.user_metadata?.nombre?.split(' ')[0] || 'cliente'}
            </h2>
            <p className="cuenta-email">{usuario.email}</p>
            <form className="reserva-form" onSubmit={guardar}>
              <div className="campos-row">
                <div className="campo">
                  <label htmlFor="u-nombre">Nombre</label>
                  <input id="u-nombre" type="text" required value={form.nombre} onChange={set('nombre')} />
                </div>
                <div className="campo">
                  <label htmlFor="u-telefono">Teléfono</label>
                  <input id="u-telefono" type="tel" required value={form.telefono} onChange={set('telefono')} />
                </div>
              </div>
              {msg && <p className={`reserva-msg ${msg.tipo}`}>{msg.texto}</p>}
              <div className="cuenta-acciones">
                <button type="submit" className="btn btn-primary" disabled={cargando}>
                  Guardar cambios
                </button>
                <button type="button" className="btn btn-outline" onClick={salir}>
                  Cerrar sesión
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <span className="section-tag">Clientes</span>
            <h2 className="section-title">
              {modo === 'ingresar' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
            </h2>
            <div className="cuenta-tabs">
              <button className={modo === 'ingresar' ? 'activo' : ''} onClick={() => { setModo('ingresar'); setMsg(null) }}>
                Ingresar
              </button>
              <button className={modo === 'crear' ? 'activo' : ''} onClick={() => { setModo('crear'); setMsg(null) }}>
                Crear cuenta
              </button>
            </div>

            {modo === 'crear' && (
              <p className="cuenta-nota">
                Con tu cuenta reservás en dos toques: no cargás más tu nombre ni tu teléfono.
              </p>
            )}

            <form className="reserva-form" onSubmit={modo === 'ingresar' ? ingresar : crear}>
              {modo === 'crear' && (
                <div className="campos-row">
                  <div className="campo">
                    <label htmlFor="a-nombre">Nombre</label>
                    <input id="a-nombre" type="text" required value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre" />
                  </div>
                  <div className="campo">
                    <label htmlFor="a-telefono">Teléfono</label>
                    <input id="a-telefono" type="tel" required value={form.telefono} onChange={set('telefono')} placeholder="099 123 456" />
                  </div>
                </div>
              )}
              <div className="campo">
                <label htmlFor="a-email">Email</label>
                <input id="a-email" type="email" required value={form.email} onChange={set('email')} placeholder="tu@email.com" />
              </div>
              <div className="campo">
                <label htmlFor="a-password">Contraseña</label>
                <input id="a-password" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" />
              </div>

              {msg && <p className={`reserva-msg ${msg.tipo}`}>{msg.texto}</p>}

              <button type="submit" className="btn btn-primary" disabled={cargando}>
                {cargando ? 'Un momento…' : modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            </form>

            <div className="cuenta-sep">
              <span>o</span>
            </div>

            <button type="button" className="btn-google" onClick={conGoogle}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.4 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.3 0-11.7-3.9-13.6-9.4l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
              Continuar con Google
            </button>
          </>
        )}
      </div>
    </div>
  )
}
