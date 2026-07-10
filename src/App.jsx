import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Sobre from './components/Sobre'
import Servicios from './components/Servicios'
import Barberos from './components/Barberos'
import ReservaModal from './components/ReservaModal'
import Ubicacion from './components/Ubicacion'
import Footer from './components/Footer'
import Separador from './components/Separador'

export default function App() {
  const [modal, setModal] = useState({ abierto: false, preseleccion: null })

  // Los botones "reservar" abren el modal, opcionalmente con servicio/barbero precargado
  function abrirReserva(datos = null) {
    setModal({ abierto: true, preseleccion: datos })
  }

  function cerrarReserva() {
    setModal({ abierto: false, preseleccion: null })
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
