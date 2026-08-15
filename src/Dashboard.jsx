import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, CreditCard, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from './supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [metas, setMetas] = useState([])

  const hoy = new Date()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const [resPerfil, resCuentas, resMovs, resMetas] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', user.id).single(),
        supabase.from('cuentas').select('*').eq('usuario_id', user.id),
        supabase.from('movimientos').select('*').eq('usuario_id', user.id),
        supabase.from('metas').select('*').eq('usuario_id', user.id).eq('estado', 'en progreso')
      ])

      if (resPerfil.data) setPerfil(resPerfil.data)
      if (resCuentas.data) setCuentas(resCuentas.data)
      if (resMovs.data) setMovimientos(resMovs.data)
      if (resMetas.data) setMetas(resMetas.data)
    }
    setLoading(false)
  }

  // --- FORMATEADORES ---
  const moneda = perfil?.moneda || 'S/'
  const formatearMonto = (monto) => `${moneda} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)}`
  
  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const fechaActual = hoy.toLocaleDateString('es-PE', opcionesFecha)

  // --- CÁLCULOS PRINCIPALES ---
  const cuentasAhorro = cuentas.filter(c => c.tipo === 'ahorro')
  const totalAhorros = cuentasAhorro.reduce((acc, curr) => acc + Number(curr.saldo), 0)
  
  const tarjetasCredito = cuentas.filter(c => c.tipo === 'credito')
  const totalDeudas = tarjetasCredito.reduce((acc, curr) => acc + Number(curr.saldo), 0)
  
  const cuentasDebito = cuentas.filter(c => c.tipo === 'debito')

  const patrimonioNeto = totalAhorros - totalDeudas

  const ingresosMesConf = perfil?.ingresos_mensuales || 0

  // Gastos del mes actual
  const gastosMesActual = movimientos
    .filter(m => m.tipo === 'gasto')
    .filter(m => {
      const d = new Date(m.fecha + 'T00:00:00')
      return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()
    })
    .reduce((acc, curr) => acc + Number(curr.monto), 0)

  // Próximos Pagos (7 días)
  const obtenerProximoPago = () => {
    let proximo = null
    let menorDias = 999
    
    tarjetasCredito.forEach(tc => {
      if (!tc.dia_pago) return
      let fechaPago = new Date(hoy.getFullYear(), hoy.getMonth(), tc.dia_pago)
      if (fechaPago < hoy) fechaPago = new Date(hoy.getFullYear(), hoy.getMonth() + 1, tc.dia_pago)
      
      const diasFaltantes = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24))
      if (diasFaltantes <= 7 && diasFaltantes < menorDias) {
        menorDias = diasFaltantes
        proximo = { nombre: tc.nombre, dia: tc.dia_pago, faltan: diasFaltantes }
      }
    })
    return proximo
  }
  const alertaPago = obtenerProximoPago()

  // --- DATOS PARA GRÁFICOS ---
  // 1. Gráfico de Barras (Últimos 6 meses)
  const generarDatosBarras = () => {
    const mesesAbrev = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const datos = []
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      datos.push({ mesNum: d.getMonth(), anioNum: d.getFullYear(), name: mesesAbrev[d.getMonth()], Ingresos: 0, Gastos: 0 })
    }

    movimientos.forEach(m => {
      const d = new Date(m.fecha + 'T00:00:00')
      const match = datos.find(x => x.mesNum === d.getMonth() && x.anioNum === d.getFullYear())
      if (match) {
        if (m.tipo === 'ingreso') match.Ingresos += Number(m.monto)
        if (m.tipo === 'gasto') match.Gastos += Number(m.monto)
      }
    })
    return datos
  }
  const datosBarras = generarDatosBarras()

  // 2. Gráfico de Dona (Ahorros vs Deudas)
  const datosDona = [
    { name: 'Ahorros', value: totalAhorros, color: '#6d28d9' },
    { name: 'Deudas', value: totalDeudas, color: '#ef4444' }
  ]

  // 3. Proyección de Meta
  const metaPrincipal = metas.length > 0 ? metas[0] : null
  let mesesEstimadosMeta = 0
  if (metaPrincipal && perfil?.meta_ahorro > 0) {
    const faltante = metaPrincipal.monto_objetivo - metaPrincipal.monto_actual
    mesesEstimadosMeta = Math.ceil(faltante / perfil.meta_ahorro)
  }

  if (loading) return <div style={{ padding: '40px' }}>Cargando tu dashboard...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Dashboard</h2>
        <p style={{ color: '#6b7280', margin: 0, textTransform: 'capitalize' }}>{fechaActual}</p>
      </div>

      {/* Alerta de Próximos Pagos */}
      {alertaPago ? (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef08a', padding: '15px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <AlertCircle size={20} color="#ca8a04" />
          <div>
            <h4 style={{ margin: 0, color: '#ca8a04', fontSize: '14px', fontWeight: '600' }}>Próximos pagos</h4>
            <p style={{ margin: 0, color: '#a16207', fontSize: '13px' }}>{alertaPago.nombre} (día {alertaPago.dia}) — vencen en los próximos {alertaPago.faltan} días</p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '30px' }}></div>
      )}

      {/* Tarjetas de Resumen (Grid 4 columnas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* Ahorros */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>Ahorros</span>
            <div style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '8px', color: '#16a34a' }}><Wallet size={18} /></div>
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            {perfil?.mostrar_ahorros !== false ? formatearMonto(totalAhorros) : '****'}
          </h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Balance total guardado</p>
        </div>

        {/* Ingresos */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>Ingresos del mes</span>
            <div style={{ backgroundColor: '#f3e8ff', padding: '8px', borderRadius: '8px', color: '#7e22ce' }}><TrendingUp size={18} /></div>
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{formatearMonto(ingresosMesConf)}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Según configuración</p>
        </div>

        {/* Gastos */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>Gastos del mes</span>
            <div style={{ backgroundColor: '#fee2e2', padding: '8px', borderRadius: '8px', color: '#dc2626' }}><TrendingDown size={18} /></div>
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{formatearMonto(gastosMesActual)}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Mes actual</p>
        </div>

        {/* Patrimonio Neto */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>Patrimonio neto</span>
            <div style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '8px', color: '#16a34a' }}><ArrowUpRight size={18} /></div>
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{formatearMonto(patrimonioNeto)}</h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px', color: patrimonioNeto >= 0 ? '#10b981' : '#ef4444' }}>
            {patrimonioNeto >= 0 ? '↑ Positivo' : '↓ Negativo'}
          </p>
        </div>
      </div>

      {/* Tarjetas de Crédito */}
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '15px' }}>Tarjetas de crédito</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {tarjetasCredito.map(tc => {
          const pct = tc.linea_credito > 0 ? (tc.saldo / tc.linea_credito) * 100 : 0
          return (
            <div key={tc.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '6px', borderRadius: '6px' }}><CreditCard size={18}/></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{tc.nombre}</h4>
                    <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{tc.entidad}</span>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>{pct.toFixed(0)}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
                <span>Usado: {formatearMonto(tc.saldo)}</span>
                <span>Línea: {formatearMonto(tc.linea_credito)}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: '#f59e0b', borderRadius: '3px' }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '15px' }}>Disponible: {formatearMonto(tc.linea_credito - tc.saldo)}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                <span>Pago: día {tc.dia_pago || '-'} · Corte: día {tc.dia_corte || '-'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cuentas de Débito */}
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '15px' }}>Cuentas de débito</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {cuentasDebito.map(cd => (
          <div key={cd.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#fce7f3', color: '#ec4899', padding: '6px', borderRadius: '6px' }}><Wallet size={18}/></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{cd.nombre}</h4>
                <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{cd.entidad}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{formatearMonto(cd.saldo)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Barras: Movimientos por mes */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 'bold', color: '#374151' }}>Movimientos por mes</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosBarras} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val >= 1000 ? (val/1000)+'k' : val}`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(value) => formatearMonto(value)} labelStyle={{ color: '#111827', fontWeight: 'bold', textTransform: 'capitalize' }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#10b981' }}></div> Ingresos</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#ef4444' }}></div> Gastos</span>
          </div>
        </div>

        {/* Dona: Ahorros vs Deudas */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#374151' }}>Ahorros vs Deudas</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datosDona} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                  {datosDona.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatearMonto(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#4b5563' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#6d28d9' }}></div> Ahorros</span>
              <span style={{ fontWeight: 'bold' }}>{formatearMonto(totalAhorros)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#ef4444' }}></div> Deudas</span>
              <span style={{ fontWeight: 'bold' }}>{formatearMonto(totalDeudas)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Proyección de Meta */}
      {metaPrincipal && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <div style={{ backgroundColor: '#f3e8ff', color: '#6d28d9', padding: '6px', borderRadius: '50%' }}><Target size={18}/></div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>Proyección de meta: {metaPrincipal.nombre}</h3>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              <span>{formatearMonto(metaPrincipal.monto_actual)}</span>
              <span>{formatearMonto(metaPrincipal.monto_objetivo)}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((metaPrincipal.monto_actual/metaPrincipal.monto_objetivo)*100, 100)}%`, backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Ahorrando {formatearMonto(perfil?.meta_ahorro)} por mes</p>
          </div>

          <div style={{ backgroundColor: '#f3e8ff', padding: '15px 25px', borderRadius: '12px', textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6d28d9' }}>{mesesEstimadosMeta}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>meses estimados</div>
          </div>
        </div>
      )}

    </div>
  )
}