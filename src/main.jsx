import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CatalogoProvider } from './lib/catalogo'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CatalogoProvider>
      <App />
    </CatalogoProvider>
  </React.StrictMode>,
)
