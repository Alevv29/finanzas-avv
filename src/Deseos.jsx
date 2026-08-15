import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Check, ShoppingCart } from 'lucide-react'
import { supabase } from './supabase'

export default function Deseos() {
  const [deseos, setDeseos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('Pendientes')
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  const estadoInicial = { id: null, nombre: '', precio: '', prioridad: 'Media', url: '', notas: '' }
  const [formData, setFormData] = useState(estadoInicial)

  useEffect(() => {
    fetchDeseos()
  }, [])

  const fetchDeseos = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('deseos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('id', { ascending: false })
      
      if (!error && data) setDeseos(data)
    }
    setLoading(false)
  }

  const formatearSoles = (monto) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0)
  }

  const handleAbrirModal = () => {
    setFormData(estadoInicial)
    setModalAbierto(true)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const payload = {
      usuario_id: user.id,
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      prioridad: formData.prioridad,
      url: formData.url || null,
      notas: formData.notas || null,
      comprado: false
    }

    await supabase.from('deseos').insert([payload])

    await fetchDeseos()
    setModalAbierto(false)
    setGuardando(false)
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este deseo?')) {
      await supabase.from('deseos').delete().eq('id', id)
      fetchDeseos()
    }
  }

  const handleMarcarComprado = async (id, estadoActual) => {
    await supabase.from('deseos').update({ comprado: !estadoActual }).eq('id', id)
    fetchDeseos()
  }

  // Filtrado
  const deseosFiltrados = deseos.filter(d => {
    if (filtroActivo === 'Todos') return true
    if (filtroActivo === 'Pendientes') return !d.comprado
    if (filtroActivo === 'Comprados') return d.comprado
    return true
  })

  // Total estimado solo de los pendientes
  const totalPendiente = deseos.filter(d => !d.comprado).reduce((acc, curr) => acc + Number(curr.precio), 0)

  // Colores para las etiquetas de prioridad
  const getPrioridadEstilo = (prioridad) => {
    switch(prioridad) {
      case 'Alta': return { bg: '#fee2e2', text: '#ef4444' }
      case 'Media': return { bg: '#fef3c7', text: '#d97706' }
      case 'Baja': return { bg: '#ecfdf5', text: '#10b981' }
      default: return { bg: '#f3f4f6', text: '#4b5563' }
    }
  }

  if (loading) return <div style={{ padding: '40px' }}>Cargando tu lista...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Lista de Deseos</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Cosas que quieres comprar</p>
        </div>
        <button onClick={handleAbrirModal} style={{ backgroundColor: '#2e1065', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Plus size={18} /> Agregar
        </button>
      </div>

      {/* Banner de Total Pendiente */}
      <div style={{ backgroundColor: '#f3e8ff', color: '#6d28d9', padding: '15px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <ShoppingCart size={20} />
        <span style={{ fontWeight: '600' }}>Total estimado pendiente: {formatearSoles(totalPendiente)}</span>
      </div>

      {/* Pestañas de Filtro */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {['Pendientes', 'Comprados', 'Todos'].map(filtro => (
          <button
            key={filtro}
            onClick={() => setFiltroActivo(filtro)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s',
              backgroundColor: filtroActivo === filtro ? '#2e1065' : '#f3f4f6',
              color: filtroActivo === filtro ? 'white' : '#4b5563'
            }}
          >
            {filtro}
          </button>
        ))}
      </div>

      {/* Grid de Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {deseosFiltrados.length === 0 && <p style={{ color: '#9ca3af', gridColumn: '1 / -1' }}>No hay elementos en esta categoría.</p>}
        
        {deseosFiltrados.map(deseo => {
          const estilosPrioridad = getPrioridadEstilo(deseo.prioridad)
          
          return (
            <div key={deseo.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', opacity: deseo.comprado ? 0.7 : 1 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>
                  {deseo.nombre}
                </h4>
                <span style={{ backgroundColor: estilosPrioridad.bg, color: estilosPrioridad.text, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                  {deseo.prioridad}
                </span>
              </div>
              
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6d28d9', marginBottom: '20px' }}>
                {formatearSoles(deseo.precio)}
              </div>

              {/* URL visible si existe (opcional, como un enlace extra) */}
              {deseo.url && (
                <a href={deseo.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'underline', marginBottom: '15px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  Ver producto
                </a>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button 
                  onClick={() => handleMarcarComprado(deseo.id, deseo.comprado)}
                  style={{ flex: 1, backgroundColor: deseo.comprado ? '#ecfdf5' : 'white', border: deseo.comprado ? '1px solid #10b981' : '1px solid #d1d5db', color: deseo.comprado ? '#10b981' : '#374151', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <Check size={16} /> {deseo.comprado ? 'Comprado' : 'Marcar comprado'}
                </button>
                <button onClick={() => handleEliminar(deseo.id)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* =========================================================
          MODAL "AGREGAR A LA LISTA DE DESEOS" (Idéntico a captura)
      ========================================================= */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Agregar a la lista de deseos</h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleGuardar} style={{ padding: '0 20px 20px 20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Nombre *</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="ej. iPhone 15" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #a855f7', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Precio estimado</label>
                  <input type="number" step="0.01" required value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} placeholder="0.00" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Prioridad</label>
                  <select value={formData.prioridad} onChange={e => setFormData({...formData, prioridad: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: 'white', color: '#374151', outline: 'none' }}>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>URL (opcional)</label>
                <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '25px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Notas</label>
                <input value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} placeholder="Opcional" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <X size={16} /> Cancelar
                </button>
                <button type="submit" disabled={guardando} style={{ flex: 1, padding: '10px', backgroundColor: '#a855f7', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {guardando ? 'Guardando...' : <><Check size={16} /> Agregar</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}