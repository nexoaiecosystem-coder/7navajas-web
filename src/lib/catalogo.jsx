import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { SERVICIOS, BARBEROS } from '../data/negocio'

// Catálogo vivo: servicios y barberos salen de la base (editables por el
// dueño desde el panel). Si la base no responde, se usan los de negocio.js.
const CatalogoContext = createContext({
  servicios: SERVICIOS,
  barberos: BARBEROS,
  galeria: [],
  recargar: () => {},
})

export function CatalogoProvider({ children }) {
  const [catalogo, setCatalogo] = useState({ servicios: SERVICIOS, barberos: BARBEROS, galeria: [] })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!supabase) return
    let vigente = true
    Promise.all([
      supabase.from('servicios').select('*').eq('activo', true).order('orden'),
      supabase.from('barberos').select('*').eq('activo', true).order('orden'),
      supabase.from('galeria').select('*').eq('activo', true).order('orden'),
    ]).then(([s, b, g]) => {
      if (!vigente) return
      setCatalogo({
        servicios: s.data && s.data.length ? s.data : SERVICIOS,
        barberos: b.data && b.data.length ? b.data : BARBEROS,
        galeria: g.data || [],
      })
    })
    return () => {
      vigente = false
    }
  }, [version])

  return (
    <CatalogoContext.Provider
      value={{ ...catalogo, recargar: () => setVersion((v) => v + 1) }}
    >
      {children}
    </CatalogoContext.Provider>
  )
}

export const useCatalogo = () => useContext(CatalogoContext)
