import { useEffect, useState } from 'react'
import Header from './components/Header'
import Panel from './components/Panel'
import Hero from './components/Hero'
import Sobre from './components/Sobre'
import Servicios from './components/Servicios'
import Barberos from './components/Barberos'
import Galeria from './components/Galeria'
import ReservaModal from './components/ReservaModal'
import Ubicacion from './components/Ubicacion'
import Footer from './components/Footer'
import Separador from './components/Separador'

export default function App() {
  const [modal, setModal] = useState({ abierto: false, preseleccion: null })
  const [ruta, setRuta] = useState(window.location.hash)

  useEffect(() => {
    const alCambiar = () => setRuta(window.location.hash)
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
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
      <Header onReservar={abrirReserva} />
      <main>
        <Hero onReservar={abrirReserva} />
        <Separador />
        <Sobre />
        <Separador />
        <Servicios onReservar={abrirReserva} />
        <Separador />
        <Barberos onReservar={abrirReserva} />
        <Separador />
        <Galeria />
        <Separador />
        <Ubicacion />
      </main>
      <Footer />
      <ReservaModal
        abierto={modal.abierto}
        preseleccion={modal.preseleccion}
        onCerrar={cerrarReserva}
      />
    </>
  )
}
