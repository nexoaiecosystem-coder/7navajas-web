import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Sobre from './components/Sobre'
import Servicios from './components/Servicios'
import Barberos from './components/Barberos'
import Reserva from './components/Reserva'
import Ubicacion from './components/Ubicacion'
import Footer from './components/Footer'
import Separador from './components/Separador'

export default function App() {
  const [preseleccion, setPreseleccion] = useState(null)

  // Los botones "reservar este servicio" / "reservar con X" precargan el form
  function irAReservar(datos) {
    setPreseleccion(datos)
    document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Separador />
        <Sobre />
        <Separador />
        <Servicios onReservar={irAReservar} />
        <Separador />
        <Barberos onReservar={irAReservar} />
        <Separador />
        <Reserva preseleccion={preseleccion} />
        <Separador />
        <Ubicacion />
      </main>
      <Footer />
    </>
  )
}
