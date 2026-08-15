import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Check, Trophy } from 'lucide-react'
import { supabase } from './supabase'

// Paletas expandidas según tu diseño
const EMOJIS = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '💍', '🏋️', '🎓', '💰', '🎮', '📱', '🏥', '🍼', '🎸', '🐶', '🌍', '🚀']
const COLORES = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#14b8a6', '#f97316']

export default function Metas() {
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  const estadoInicial = { id: null, nombre: '', monto_objetivo: '', monto_actual: '0', fecha_limite: '', emoji: '🎯', color: '#8b5cf6' }
  const [formData, setFormData] = useState(estadoInicial)

  useEffect(() => {
    fetchMetas()
  }, [])

  const fetchMetas = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('id', { ascending: false })
      
      if (!error && data) setMetas(data)
    }
    setLoading(false)
  }

  const formatearSoles = (monto) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0)
  }

  const formatearFechaLarga = (fechaString) => {
    if (!fechaString) return ''
    const fecha = new Date(fechaString + 'T00:00:00')
    return fecha.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }).replace('.', '')
  }

  // Calculadora de meses restantes
  const calcularMesesRestantes = (fechaLimite) => {
    if (!fechaLimite) return null
    const hoy = new Date()
    const limite = new Date(fechaLimite + 'T00:00:00')
    const meses = (limite.getFullYear() - hoy.getFullYear()) * 12 + (limite.getMonth() - hoy.getMonth())
    return meses > 0 ? meses : 0
  }

  const handleAbrirModal = (meta = null) => {
    if (meta) {
      setFormData(meta)
    } else {
      setFormData(estadoInicial)
    }
    setModalAbierto(true)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const payload = {
      usuario_id: user.id,
      nombre: formData.nombre,
      monto_objetivo: parseFloat(formData.monto_objetivo),
      monto_actual: parseFloat(formData.monto_actual) || 0,
      fecha_limite: formData.fecha_limite || null,
      emoji: formData.emoji,
      color: formData.color,
      estado: formData.monto_actual >= formData.monto_objetivo ? 'lograda' : 'en progreso'
    }

    if (formData.id) {
      await supabase.from('metas').update(payload).eq('id', formData.id)
    } else {
      await supabase.from('metas').insert([payload])
    }

    await fetchMetas()
    setModalAbierto(false)
    setGuardando(false)
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta meta?')) {
      await supabase.from('metas').delete().eq('id', id)
      fetchMetas()
    }
  }

  const handleLograrMeta = async (id, monto_objetivo) => {
    // Si la marcan como lograda, igualamos el ahorro a la meta
    await supabase.from('metas').update({ estado: 'lograda', monto_actual: monto_objetivo }).eq('id', id)
    fetchMetas()
  }

  const metasEnProgreso = metas.filter(m => m.estado === 'en progreso')
  const metasLogradas = metas.filter(m => m.estado === 'lograda')

  if (loading) return <div style={{ padding: '40px' }}>Cargando tus metas...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Metas de Ahorro</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Sigue el progreso de tus objetivos financieros</p>
        </div>
        <button onClick={() => handleAbrirModal()} style={{ backgroundColor: '#2e1065', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Plus size={18} /> Nueva meta
        </button>
      </div>

      {/* SECCIÓN: EN PROGRESO */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>En Progreso</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px', marginBottom: '50px' }}>
        {metasEnProgreso.length === 0 && <p style={{ color: '#9ca3af' }}>No tienes metas en progreso actualmente.</p>}
        
        {metasEnProgreso.map(meta => {
          const porcentaje = Math.min((meta.monto_actual / meta.monto_objetivo) * 100, 100)
          const mesesRestantes = calcularMesesRestantes(meta.fecha_limite)
          const faltante = meta.monto_objetivo - meta.monto_actual
          
          return (
            <div key={meta.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: `${meta.color}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                    {meta.emoji}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{meta.nombre}</h4>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{formatearSoles(meta.monto_objetivo)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleAbrirModal(meta)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleEliminar(meta.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  <span>{formatearSoles(meta.monto_actual)}</span>
                  <span style={{ color: meta.color, fontWeight: 'bold' }}>{porcentaje.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${porcentaje}%`, backgroundColor: meta.color, borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>Faltan {formatearSoles(faltante)}</div>
              </div>

              {/* Chips de Fecha */}
              {meta.fecha_limite && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '500' }}>
                    Fecha límite: {formatearFechaLarga(meta.fecha_limite)} ({mesesRestantes} meses)
                  </span>
                  {faltante > 0 && mesesRestantes > 0 && (
                    <span style={{ backgroundColor: `${meta.color}15`, color: meta.color, padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '500' }}>
                      ~{formatearSoles(faltante / mesesRestantes)} mensuales
                    </span>
                  )}
                </div>
              )}

              <button onClick={() => handleLograrMeta(meta.id, meta.monto_objetivo)} style={{ marginTop: 'auto', width: '100%', backgroundColor: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }}>
                <Trophy size={16} /> Marcar como lograda
              </button>
            </div>
          )
        })}
      </div>

      {/* SECCIÓN: LOGRADAS */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Logradas 🎉</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {metasLogradas.map(meta => (
          <div key={meta.id} style={{ backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${meta.color}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>
                {meta.emoji}
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold', color: '#4b5563', textDecoration: 'line-through' }}>{meta.nombre}</h4>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatearSoles(meta.monto_objetivo)}</span>
              </div>
            </div>
            <button onClick={() => handleEliminar(meta.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        ))}
      </div>

      {/* =========================================================
          MODAL "NUEVA META DE AHORRO"
      ========================================================= */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                {formData.id ? 'Editar meta' : 'Nueva meta de ahorro'}
              </h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleGuardar} style={{ padding: '0 20px 20px 20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Nombre *</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="ej. Viaje a Europa" style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${formData.color}`, fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Meta (S/) *</label>
                  <input type="number" step="0.01" required value={formData.monto_objetivo} onChange={e => setFormData({...formData, monto_objetivo: e.target.value})} placeholder="5000" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Ahorrado</label>
                  <input type="number" step="0.01" value={formData.monto_actual} onChange={e => setFormData({...formData, monto_actual: e.target.value})} placeholder="0" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Fecha límite (opcional)</label>
                <input type="date" value={formData.fecha_limite} onChange={e => setFormData({...formData, fecha_limite: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>

              {/* Selector de Emojis */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>Emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({...formData, emoji})}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px', border: formData.emoji === emoji ? `2px solid ${formData.color}` : '1px solid transparent', backgroundColor: formData.emoji === emoji ? 'white' : 'transparent', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Color */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {COLORES.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, color})}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}
                    >
                      {formData.color === color && <Check size={14} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <X size={16} /> Cancelar
                </button>
                <button type="submit" disabled={guardando} style={{ flex: 1, padding: '10px', backgroundColor: '#a855f7', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {guardando ? 'Guardando...' : <><Check size={16} /> Guardar</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}