import { useState, useEffect } from 'react'
import { Settings, User, Save, CheckCircle2 } from 'lucide-react'
import { supabase } from './supabase'

export default function Configuracion() {
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  
  // Estado combinado para el formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    ingresos_mensuales: '',
    meta_ahorro: '',
    moneda: 'S/',
    mostrar_ahorros: true
  })

  useEffect(() => {
    fetchPerfil()
  }, [])

  const fetchPerfil = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Obtenemos los datos de la tabla perfiles
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        setFormData({
          nombre_completo: data.nombre_completo || '',
          email: user.email,
          ingresos_mensuales: data.ingresos_mensuales || '',
          meta_ahorro: data.meta_ahorro || '',
          moneda: data.moneda || 'S/',
          mostrar_ahorros: data.mostrar_ahorros !== false // true por defecto
        })
      } else {
        // Si no existe el perfil aún, al menos mostramos el email
        setFormData(prev => ({ ...prev, email: user.email }))
      }
    }
    setLoading(false)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje({ texto: '', tipo: '' })
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const payload = {
      id: user.id, // Requerido porque la tabla perfiles usa el id del auth como Primary Key
      nombre_completo: formData.nombre_completo,
      ingresos_mensuales: parseFloat(formData.ingresos_mensuales) || 0,
      meta_ahorro: parseFloat(formData.meta_ahorro) || 0,
      moneda: formData.moneda,
      mostrar_ahorros: formData.mostrar_ahorros
    }

    // Usamos upsert por si el usuario es nuevo y aún no tiene registro en la tabla perfiles
    const { error } = await supabase.from('perfiles').upsert(payload)

    if (error) {
      setMensaje({ texto: 'Error al guardar los cambios.', tipo: 'error' })
    } else {
      setMensaje({ texto: 'Configuración guardada exitosamente.', tipo: 'exito' })
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    }
    
    setGuardando(false)
  }

  if (loading) return <div style={{ padding: '40px' }}>Cargando configuración...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Configuración</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Ajusta tus datos financieros principales y perfil</p>
      </div>

      <form onSubmit={handleGuardar}>
        
        {/* =========================================
            BLOQUE 1: PERFIL DE USUARIO (Extra útil)
        ========================================= */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '25px', marginBottom: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Perfil de usuario</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Nombre completo</label>
              <input 
                type="text" 
                value={formData.nombre_completo} 
                onChange={e => setFormData({...formData, nombre_completo: e.target.value})} 
                placeholder="Tu nombre" 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Correo electrónico</label>
              <input 
                type="email" 
                disabled 
                value={formData.email} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed', outline: 'none' }} 
              />
            </div>
          </div>
        </div>

        {/* =========================================
            BLOQUE 2: DATOS FINANCIEROS (Captura)
        ========================================= */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '25px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
            <Settings size={20} color="#6d28d9" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Datos financieros</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Ingresos mensuales</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }}>{formData.moneda}</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.ingresos_mensuales} 
                  onChange={e => setFormData({...formData, ingresos_mensuales: e.target.value})} 
                  placeholder="1800" 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Meta de ahorro mensual</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }}>{formData.moneda}</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.meta_ahorro} 
                  onChange={e => setFormData({...formData, meta_ahorro: e.target.value})} 
                  placeholder="700" 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Moneda</label>
              <input 
                type="text" 
                value={formData.moneda} 
                onChange={e => setFormData({...formData, moneda: e.target.value})} 
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }} 
              />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Ej: S/, $, €, CLP</span>
            </div>

            {/* Toggle (Interruptor visual) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', marginBottom: '10px' }}>
              <div 
                onClick={() => setFormData({...formData, mostrar_ahorros: !formData.mostrar_ahorros})}
                style={{ width: '44px', height: '24px', backgroundColor: formData.mostrar_ahorros ? '#6d28d9' : '#e5e7eb', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
              >
                <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mostrar_ahorros ? '23px' : '3px', transition: 'left 0.3s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}></div>
              </div>
              <span style={{ fontSize: '15px', color: '#111827' }}>Mostrar ahorros en el dashboard</span>
            </div>

            <button type="submit" disabled={guardando} style={{ width: '100%', backgroundColor: '#6d28d9', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}>
              {guardando ? 'Guardando...' : <><Save size={18} /> Guardar cambios</>}
            </button>
            
          </div>
        </div>

        {/* Alerta de éxito o error */}
        {mensaje.texto && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', borderRadius: '8px', backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#16a34a' : '#dc2626', fontWeight: '500' }}>
            {mensaje.tipo === 'exito' && <CheckCircle2 size={20} />}
            {mensaje.texto}
          </div>
        )}

      </form>
    </div>
  )
}