import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, ArrowRightLeft, Target, Heart, Calendar, Settings, Moon, Sun, LogOut } from 'lucide-react'
import { supabase } from './supabase'

export default function Sidebar() {
  // Estado para el modo oscuro (lee la preferencia guardada)
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  // Aplica la clase al body entero cuando cambia el estado
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Tarjetas', path: '/tarjetas', icon: <CreditCard size={20} /> },
    { name: 'Movimientos', path: '/movimientos', icon: <ArrowRightLeft size={20} /> },
    { name: 'Metas', path: '/metas', icon: <Target size={20} /> },
    { name: 'Lista de Deseos', path: '/deseos', icon: <Heart size={20} /> },
    { name: 'Calendario', path: '/calendario', icon: <Calendar size={20} /> },
    { name: 'Configuración', path: '/configuracion', icon: <Settings size={20} /> },
  ]

  return (
    <aside style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px 0' }}>
      
      {/* Logo */}
      <div style={{ padding: '0 20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ backgroundColor: '#6d28d9', padding: '8px', borderRadius: '8px', color: 'white' }}>
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>Finanzas AVV</h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Panel Financiero</p>
        </div>
      </div>

      {/* Menú de navegación */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 10px' }}>
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 15px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#6d28d9' : '#4b5563',
              backgroundColor: isActive ? '#f3e8ff' : 'transparent',
              fontWeight: isActive ? '600' : '400',
              transition: 'all 0.2s'
            })}
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* Botones inferiores (SOLO UNO DE TEMA Y UNO DE SALIR) */}
      <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Botón dinámico de Modo Oscuro/Claro */}
        <button 
          onClick={() => setIsDark(!isDark)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />} 
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
        
        <button 
          onClick={() => supabase.auth.signOut()} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>

      </div>
    </aside>
  )
}