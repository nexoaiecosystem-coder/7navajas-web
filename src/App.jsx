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

  // Ruta privada de los barberos
  if (ruta === '#panel') {
    return <Panel />
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
