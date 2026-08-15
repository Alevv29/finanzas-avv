import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, CreditCard, Wallet, PiggyBank, X, Check } from 'lucide-react'
import { supabase } from './supabase'

// Paleta de colores basada en tu captura
const COLORES = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#14b8a6', '#f97316']

export default function Tarjetas() {
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para el Modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mostrarDashboard, setMostrarDashboard] = useState(true) // Visual por ahora
  
  // Estado del formulario
  const estadoInicial = { id: null, tipo: 'credito', nombre: '', entidad: '', linea_credito: '', saldo: '', dia_corte: '', dia_pago: '', color: COLORES[1] }
  const [formData, setFormData] = useState(estadoInicial)

  // Cargar datos al entrar
  useEffect(() => {
    fetchCuentas()
  }, [])

  const fetchCuentas = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('id', { ascending: true })
      
      if (!error && data) setCuentas(data)
    }
    setLoading(false)
  }

  const formatearSoles = (monto) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0)
  }

  // Lógica del Formulario (Crear y Editar)
  const handleAbrirModal = (cuenta = null) => {
    if (cuenta) {
      setFormData(cuenta) // Editar
    } else {
      setFormData(estadoInicial) // Nueva
    }
    setModalAbierto(true)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    // Preparamos los datos según el tipo
    const payload = {
      usuario_id: user.id,
      tipo: formData.tipo,
      nombre: formData.nombre,
      entidad: formData.entidad,
      saldo: parseFloat(formData.saldo) || 0,
      linea_credito: formData.tipo === 'credito' ? (parseFloat(formData.linea_credito) || 0) : 0,
      dia_corte: formData.tipo === 'credito' ? (parseInt(formData.dia_corte) || null) : null,
      dia_pago: formData.tipo === 'credito' ? (parseInt(formData.dia_pago) || null) : null,
      color: formData.color
    }

    if (formData.id) {
      // Actualizar existente
      await supabase.from('cuentas').update(payload).eq('id', formData.id)
    } else {
      // Crear nueva
      await supabase.from('cuentas').insert([payload])
    }

    await fetchCuentas()
    setModalAbierto(false)
    setGuardando(false)
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta cuenta?')) {
      await supabase.from('cuentas').delete().eq('id', id)
      fetchCuentas()
    }
  }

  // Filtrado de cuentas para mostrar en la interfaz
  const tarjetasCredito = cuentas.filter(c => c.tipo === 'credito')
  const cuentasDebito = cuentas.filter(c => c.tipo === 'debito')
  const cuentasAhorro = cuentas.filter(c => c.tipo === 'ahorro')
  const totalAhorro = cuentasAhorro.reduce((acc, curr) => acc + Number(curr.saldo || 0), 0)

  if (loading) return <div style={{ padding: '40px' }}>Cargando tus cuentas...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Cuentas y Tarjetas</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Gestiona tus tarjetas y cuentas bancarias</p>
        </div>
        <button onClick={() => handleAbrirModal()} style={{ backgroundColor: '#6d28d9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Plus size={18} /> Nueva
        </button>
      </div>

      {/* Banner Total Ahorros */}
      <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '15px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
          <PiggyBank size={20} />
          <span>Total en cuentas de ahorro</span>
        </div>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{formatearSoles(totalAhorro)}</span>
      </div>

      {/* SECCIÓN: Tarjetas de Crédito */}
      {tarjetasCredito.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '15px' }}>Tarjetas de crédito</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {tarjetasCredito.map(tc => {
              const porcentajeUsado = tc.linea_credito > 0 ? (tc.saldo / tc.linea_credito) * 100 : 0;
              return (
                <div key={tc.id} style={{ backgroundColor: tc.color, borderRadius: '16px', color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12px', opacity: 0.9, textTransform: 'uppercase' }}>{tc.entidad} <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Crédito</span></span>
                      <CreditCard size={24} style={{ opacity: 0.8 }} />
                    </div>
                    <h4 style={{ fontSize: '22px', margin: '10px 0 20px 0' }}>{tc.nombre}</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>Saldo usado</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatearSoles(tc.saldo)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>Línea</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatearSoles(tc.linea_credito)}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                        <span>Disponible: {formatearSoles(tc.linea_credito - tc.saldo)}</span>
                        <span>{porcentajeUsado.toFixed(0)}% usado</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${Math.min(porcentajeUsado, 100)}%`, backgroundColor: 'white', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Corte: día {tc.dia_corte || '-'}</span>
                      <span>Pago: día {tc.dia_pago || '-'}</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleAbrirModal(tc)} style={{ flex: 1, backgroundColor: '#f3f4f6', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#4b5563', fontSize: '13px' }}><Edit2 size={16}/> Editar</button>
                    <button onClick={() => handleEliminar(tc.id)} style={{ backgroundColor: '#fee2e2', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN: Cuentas de Débito y Ahorro */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
        
        {/* Débito */}
        {cuentasDebito.length > 0 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '15px' }}>Cuentas de débito</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cuentasDebito.map(cd => (
                <div key={cd.id} style={{ backgroundColor: cd.color, borderRadius: '16px', color: 'white', overflow: 'hidden' }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12px', opacity: 0.9 }}>{cd.entidad} <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Débito</span></span>
                      <Wallet size={24} style={{ opacity: 0.8 }} />
                    </div>
                    <h4 style={{ fontSize: '22px', margin: '10px 0 20px 0' }}>{cd.nombre}</h4>
                    <div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>Saldo disponible</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatearSoles(cd.saldo)}</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleAbrirModal(cd)} style={{ flex: 1, backgroundColor: '#f3f4f6', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#4b5563', fontSize: '13px' }}><Edit2 size={16}/> Editar</button>
                    <button onClick={() => handleEliminar(cd.id)} style={{ backgroundColor: '#fee2e2', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ahorro */}
        {cuentasAhorro.length > 0 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '15px' }}>Cuentas de ahorro</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cuentasAhorro.map(ca => (
                <div key={ca.id} style={{ backgroundColor: ca.color, borderRadius: '16px', color: 'white', overflow: 'hidden' }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12px', opacity: 0.9 }}>{ca.entidad} <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Ahorro</span></span>
                      <PiggyBank size={24} style={{ opacity: 0.8 }} />
                    </div>
                    <h4 style={{ fontSize: '22px', margin: '10px 0 20px 0' }}>{ca.nombre}</h4>
                    <div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>Saldo ahorrado</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatearSoles(ca.saldo)}</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleAbrirModal(ca)} style={{ flex: 1, backgroundColor: '#f3f4f6', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#4b5563', fontSize: '13px' }}><Edit2 size={16}/> Editar</button>
                    <button onClick={() => handleEliminar(ca.id)} style={{ backgroundColor: '#fee2e2', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* =========================================================
          MODAL DE CREACIÓN / EDICIÓN (Diseño idéntico a captura)
      ========================================================= */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Cabecera del Modal */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                {formData.id ? 'Editar' : 'Nueva cuenta'}
              </h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardar} style={{ padding: '20px' }}>
              
              {/* Selector de Tipo (Crédito, Débito, Ahorro) */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                {[
                  { id: 'credito', label: 'Crédito', icon: <CreditCard size={18}/> },
                  { id: 'debito', label: 'Débito', icon: <Wallet size={18}/> },
                  { id: 'ahorro', label: 'Ahorro', icon: <PiggyBank size={18}/> }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: t.id })}
                    style={{
                      flex: 1, padding: '12px 10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'all 0.2s',
                      backgroundColor: formData.tipo === t.id ? '#6d28d9' : 'white',
                      color: formData.tipo === t.id ? 'white' : '#6b7280',
                      border: formData.tipo === t.id ? 'none' : '1px solid #e5e7eb',
                      fontWeight: formData.tipo === t.id ? '600' : '400',
                    }}
                  >
                    {t.icon}
                    <span style={{ fontSize: '13px' }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid de Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Nombre *</label>
                  <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. SIP" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Banco</label>
                  <input value={formData.entidad} onChange={e => setFormData({...formData, entidad: e.target.value})} placeholder="Ej. FINANCIERA OH" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>

                {formData.tipo === 'credito' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Línea de crédito *</label>
                    <input type="number" step="0.01" required value={formData.linea_credito} onChange={e => setFormData({...formData, linea_credito: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                    {formData.tipo === 'credito' ? 'Saldo usado' : 'Saldo disponible'}
                  </label>
                  <input type="number" step="0.01" value={formData.saldo} onChange={e => setFormData({...formData, saldo: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>

                {formData.tipo === 'credito' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Día de corte</label>
                      <input type="number" min="1" max="31" value={formData.dia_corte} onChange={e => setFormData({...formData, dia_corte: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Día de pago</label>
                      <input type="number" min="1" max="31" value={formData.dia_pago} onChange={e => setFormData({...formData, dia_pago: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                    </div>
                  </>
                )}
              </div>

              {/* Selector de Color */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {COLORES.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, color})}
                      style={{
                        width: '30px', height: '30px', borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}
                    >
                      {formData.color === color && <Check size={16} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle de Dashboard (Visual por ahora) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                <div 
                  onClick={() => setMostrarDashboard(!mostrarDashboard)}
                  style={{ width: '40px', height: '24px', backgroundColor: mostrarDashboard ? '#6d28d9' : '#e5e7eb', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: mostrarDashboard ? '19px' : '3px', transition: 'left 0.2s' }}></div>
                </div>
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>Mostrar en dashboard</span>
              </div>

              {/* Botones de acción Footer */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontWeight: '500' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} style={{ flex: 1, padding: '12px', backgroundColor: '#6d28d9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {guardando ? 'Guardando...' : <><Check size={18} /> Guardar</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
} 