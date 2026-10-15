import { useState } from 'react'

// Evita el "pop" brusco cuando la imagen termina de cargar: aparece con un fundido suave
export default function ImgFade({ className = '', onLoad, loading = 'lazy', ...props }) {
  const [lista, setLista] = useState(false)
  return (
    <img
      className={['img-fade', lista && 'img-fade-lista', className].filter(Boolean).join(' ')}
      loading={loading}
      onLoad={(e) => {
        setLista(true)
        onLoad?.(e)
      }}
      {...props}
    />
  )
}
