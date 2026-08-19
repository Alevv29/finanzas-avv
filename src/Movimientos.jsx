import { useState, useEffect } from 'react'
import { Plus, Download, ArrowDownCircle, ArrowUpCircle, X, Check, Calendar as CalendarIcon } from 'lucide-react'
import { supabase } from './supabase'

const CATEGORIAS_GASTO = ['Alimentación', 'Transporte', 'Educación', 'Pago de tarjeta', 'Pago deuda', 'Entretenimiento', 'Salud', 'Otros']
const CATEGORIAS_INGRESO = ['Sueldo', 'Negocio', 'Inversiones', 'Préstamo', 'Otros']

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [cuentas, setCuentas] = useState([]) // <-- Nuevo estado para guardar las tarjetas
  const [loading, setLoading] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('Todos')
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  const fechaHoy = new Date().toISOString().split('T')[0]
  // Añadimos cuenta_id y notas al estado inicial
  const estadoInicial = { tipo: 'gasto', monto: '', descripcion: '', categoria: 'Otros', fecha: fechaHoy, cuenta_id: '', notas: '' }
  const [formData, setFormData] = useState(estadoInicial)

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const [resMovs, resCuentas] = await Promise.all([
        supabase
          .from('movimientos')
          .select('*, cuentas(nombre)')
          .eq('usuario_id', user.id)
          .order('fecha', { ascending: false })
          .order('id', { ascending: false }),
        supabase
          .from('cuentas')
          // AQUÍ AGREGAMOS 'saldo' A LA CONSULTA:
          .select('id, nombre, tipo, entidad, saldo') 
          .eq('usuario_id', user.id)
      ])
      
      if (!resMovs.error) setMovimientos(resMovs.data || [])
      if (!resCuentas.error) setCuentas(resCuentas.data || [])
    }
    setLoading(false)
  }

  const formatearSoles = (monto) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0)
  }

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString + 'T00:00:00')
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' }
    return fecha.toLocaleDateString('es-PE', opciones).replace('.', '')
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    const montoNumerico = parseFloat(formData.monto)
    
    // 1. Preparamos y guardamos el movimiento
    const payload = {
      usuario_id: user.id,
      tipo: formData.tipo,
      monto: montoNumerico,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      fecha: formData.fecha,
      cuenta_id: formData.cuenta_id || null
    }

    await supabase.from('movimientos').insert([payload])

    // 2. LÓGICA NUEVA: Actualizar el saldo de la tarjeta
    if (formData.cuenta_id) {
      const cuentaSeleccionada = cuentas.find(c => c.id === formData.cuenta_id)
      
      if (cuentaSeleccionada) {
        let nuevoSaldo = Number(cuentaSeleccionada.saldo || 0)

        if (formData.tipo === 'gasto') {
          // En crédito el gasto aumenta la deuda, en débito/ahorro resta el dinero
          if (cuentaSeleccionada.tipo === 'credito') {
            nuevoSaldo += montoNumerico
          } else {
            nuevoSaldo -= montoNumerico
          }
        } else if (formData.tipo === 'ingreso') {
          // En crédito el ingreso baja la deuda, en débito/ahorro suma dinero
          if (cuentaSeleccionada.tipo === 'credito') {
            nuevoSaldo -= montoNumerico
          } else {
            nuevoSaldo += montoNumerico
          }
        }

        // Enviamos el nuevo saldo a Supabase
        await supabase
          .from('cuentas')
          .update({ saldo: nuevoSaldo })
          .eq('id', formData.cuenta_id)
      }
    }

    await fetchDatos() // Recargamos para ver los cambios
    setModalAbierto(false)
    setGuardando(false)
    setFormData(estadoInicial)
  }

  const movimientosFiltrados = movimientos.filter(m => {
    if (filtroActivo === 'Todos') return true
    if (filtroActivo === 'Ingresos') return m.tipo === 'ingreso'
    if (filtroActivo === 'Gastos') return m.tipo === 'gasto'
    return true
  })

  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, curr) => acc + Number(curr.monto), 0)
  const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((acc, curr) => acc + Number(curr.monto), 0)

  const opcionesCategoria = formData.tipo === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO

  if (loading) return <div style={{ padding: '40px' }}>Cargando tus datos...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Movimientos</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Historial de ingresos y gastos</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <Download size={18} /> Exportar
          </button>
          <button onClick={() => setModalAbierto(true)} style={{ backgroundColor: '#6d28d9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      {/* Resumen Superior */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '20px', borderRadius: '12px' }}>
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>Ingresos</span>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#047857' }}>{formatearSoles(totalIngresos)}</h3>
        </div>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '12px' }}>
          <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>Gastos</span>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>{formatearSoles(totalGastos)}</h3>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        {['Todos', 'Ingresos', 'Gastos'].map(filtro => (
          <button
            key={filtro}
            onClick={() => setFiltroActivo(filtro)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s',
              backgroundColor: filtroActivo === filtro ? '#6d28d9' : '#f3f4f6',
              color: filtroActivo === filtro ? 'white' : '#4b5563'
            }}
          >
            {filtro}
          </button>
        ))}
        <select style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '13px', fontWeight: '500', outline: 'none', cursor: 'pointer', marginLeft: '10px' }}>
          <option>Todos los meses</option>
          <option>Este mes</option>
        </select>
      </div>

      {/* Lista de Movimientos */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {movimientosFiltrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No hay movimientos registrados.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {movimientosFiltrados.map((mov, index) => (
              <div key={mov.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: index === movimientosFiltrados.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                
                <div style={{ marginRight: '15px', color: mov.tipo === 'gasto' ? '#f87171' : '#60a5fa' }}>
                  {mov.tipo === 'gasto' ? <ArrowDownCircle size={28} strokeWidth={1.5} /> : <ArrowUpCircle size={28} strokeWidth={1.5} />}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{mov.descripcion}</h4>
                  <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {mov.categoria} • {formatearFecha(mov.fecha)} 
                    {/* Aquí mostramos la tarjeta si fue seleccionada */}
                    {mov.cuentas?.nombre && (
                      <span style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '5px' }}>
                        💳 {mov.cuentas.nombre}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 'bold', color: mov.tipo === 'gasto' ? '#ef4444' : '#10b981' }}>
                  {mov.tipo === 'gasto' ? '-' : ''}{formatearSoles(mov.monto)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL "NUEVO MOVIMIENTO" (Idéntico a tu captura)
      ========================================================= */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Nuevo movimiento</h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardar} style={{ padding: '0 20px 20px 20px' }}>
              
              {/* Botones Ingreso / Gasto */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'ingreso', categoria: CATEGORIAS_INGRESO[0] })}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: formData.tipo === 'ingreso' ? 'white' : 'white',
                    color: formData.tipo === 'ingreso' ? '#10b981' : '#6b7280',
                    border: formData.tipo === 'ingreso' ? '1px solid #10b981' : '1px solid #e5e7eb',
                    fontWeight: '500',
                  }}
                >
                  <ArrowUpCircle size={16}/> Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'gasto', categoria: CATEGORIAS_GASTO[0] })}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: formData.tipo === 'gasto' ? '#ef4444' : 'white',
                    color: formData.tipo === 'gasto' ? 'white' : '#6b7280',
                    border: formData.tipo === 'gasto' ? 'none' : '1px solid #e5e7eb',
                    fontWeight: '500',
                  }}
                >
                  <ArrowDownCircle size={16}/> Gasto
                </button>
              </div>

              {/* Descripción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Descripción *</label>
                <input required value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="ej. Almuerzo trabajo" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
              </div>

              {/* Monto y Fecha (Grid 2 columnas) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Monto *</label>
                  <input type="number" step="0.01" required value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} placeholder="0.00" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', position: 'relative' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Fecha *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type="date" required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} style={{ width: '100%', padding: '10px 12px', paddingRight: '35px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Categoría */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Categoría</label>
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #a855f7', fontSize: '14px', backgroundColor: 'white', color: '#374151', outline: 'none' }}>
                  {opcionesCategoria.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tarjeta (opcional) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Tarjeta (opcional)</label>
                <select value={formData.cuenta_id} onChange={e => setFormData({...formData, cuenta_id: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: 'white', color: '#374151', outline: 'none' }}>
                  <option value="">Ninguna</option>
                  {cuentas.map(cuenta => (
                    <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} ({cuenta.entidad})</option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '25px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Notas</label>
                <input value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} placeholder="Opcional" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
              </div>

              {/* Botones de acción Footer */}
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