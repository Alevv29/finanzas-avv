import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Sidebar from './Sidebar'
import Login from './Login'
import Dashboard from './Dashboard'
import Tarjetas from './Tarjetas'
import Movimientos from './Movimientos'
import Metas from './Metas'
import Deseos from './Deseos'
import Calendario from './Calendario'
import Configuracion from './Configuracion'

const VistaTemporal = ({ titulo }) => (
  <div style={{ padding: '40px' }}>
    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{titulo}</h2>
    <p style={{ color: '#6b7280', marginTop: '10px' }}>Esta vista está en construcción...</p>
  </div>
)

function App() {
  const [session, setSession] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (cargando) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>
  
  if (!session) return <Login />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tarjetas" element={<Tarjetas />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/deseos" element={<Deseos />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/configuracion" element={<Configuracion />} />
            {/* Redirección por defecto si la ruta no existe */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App