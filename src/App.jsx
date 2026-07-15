import { useEffect, useState } from 'react'
import Header from './components/Header'
import Panel from './components/Panel'
import Hero from './components/Hero'
import Sobre from './components/Sobre'
import Servicios from './components/Servicios'
import Barberos from './components/Barberos'
import Galeria from './components/Galeria'
import Resenias from './components/Resenias'
import ReservaModal from './components/ReservaModal'
import CancelarModal from './components/CancelarModal'
import CuentaModal from './components/CuentaModal'
import { supabase } from './lib/supabase'
import Ubicacion from './components/Ubicacion'
import Contacto from './components/Contacto'
import Footer from './components/Footer'
import Separador from './components/Separador'

export default function App() {
  const [modal, setModal] = useState({ abierto: false, preseleccion: null })
  const [cancelarAbierto, setCancelarAbierto] = useState(false)
  const [cuentaAbierta, setCuentaAbierta] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [ruta, setRuta] = useState(window.location.hash)

  useEffect(() => {
    const alCambiar = () => setRuta(window.location.hash)
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  // Al abrir/refrescar: arrancar arriba de todo y despedir la pantalla de carga
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    if (window.location.hash && window.location.hash !== '#panel') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setRuta('')
    }
    window.scrollTo(0, 0)

    const splash = document.getElementById('splash')
    if (splash) {
      const t = setTimeout(() => {
        splash.classList.add('oculto')
        setTimeout(() => splash.remove(), 600)
      }, 450)
      return () => clearTimeout(t)
    }
  }, [])

  // Sesión del cliente (Supabase Auth)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUsuario(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Los botones "reservar" abren el modal, opcionalmente con servicio/barbero precargado
  function abrirReserva(datos = null) {
    setModal({ abierto: true, preseleccion: datos })
  }

  function cerrarReserva() {
    setModal({ abierto: false, preseleccion: null })
  }

  // Ruta privada de los barberos: se entra con la cuenta, como los clientes
  if (ruta === '#panel') {
    return (
      <>
        <Panel usuario={usuario} onCuenta={() => setCuentaAbierta(true)} />
        <CuentaModal
          abierto={cuentaAbierta}
          usuario={usuario}
          onCerrar={() => setCuentaAbierta(false)}
        />
      </>
    )
  }

  return (
    <>
      <Header
        onReservar={abrirReserva}
        onCuenta={() => setCuentaAbierta(true)}
        usuario={usuario}
      />
      <main>
        <Hero onReservar={abrirReserva} />
        <Separador />
        <Servicios onReservar={abrirReserva} />
        <Separador />
        <Barberos onReservar={abrirReserva} />
        <Separador />
        <Sobre />
        <Separador />
        <Galeria />
        <Separador />
        <Resenias />
        <Separador />
        <Ubicacion />
        <Separador />
        <Contacto onReservar={abrirReserva} onCancelar={() => setCancelarAbierto(true)} />
      </main>
      <Footer onCancelar={() => setCancelarAbierto(true)} />
      {/* botón flotante de reserva, solo en celular */}
      <button className="fab-reservar" onClick={() => abrirReserva()}>
        Reservar turno
      </button>
      {/* flotantes: subir al inicio + redes */}
      <div className="flotantes">
        <button
          className="flotante"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Subir al inicio"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        <a
          className="flotante"
          href="https://instagram.com/7navajas.barber"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram de la barbería"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
      </div>
      <ReservaModal
        abierto={modal.abierto}
        preseleccion={modal.preseleccion}
        usuario={usuario}
        onCerrar={cerrarReserva}
      />
      <CancelarModal
        abierto={cancelarAbierto}
        usuario={usuario}
        onCerrar={() => setCancelarAbierto(false)}
      />
      <CuentaModal
        abierto={cuentaAbierta}
        usuario={usuario}
        onCerrar={() => setCuentaAbierta(false)}
      />
    </>
  )
}
