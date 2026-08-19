import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, AlertCircle, CreditCard, Wallet, PiggyBank } from 'lucide-react'
import { supabase } from './supabase'

export default function Calendario() {
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Usamos la fecha actual para el calendario
  const hoy = new Date()
  const [mesVisible, setMesVisible] = useState(hoy.getMonth())
  const [anioVisible, setAnioVisible] = useState(hoy.getFullYear())

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

  // Lógica para cambiar de mes
  const cambiarMes = (incremento) => {
    let nuevoMes = mesVisible + incremento
    let nuevoAnio = anioVisible
    if (nuevoMes > 11) {
      nuevoMes = 0
      nuevoAnio++
    } else if (nuevoMes < 0) {
      nuevoMes = 11
      nuevoAnio--
    }
    setMesVisible(nuevoMes)
    setAnioVisible(nuevoAnio)
  }

  const nombreMesVisible = new Date(anioVisible, mesVisible).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })

  // Generar la grilla del calendario (días vacíos al inicio + días del mes)
  const generarGrillaMes = () => {
    const totalDias = new Date(anioVisible, mesVisible + 1, 0).getDate()
    const primerDiaSemana = new Date(anioVisible, mesVisible, 1).getDay() // 0 = Domingo
    
    const dias = []
    for (let i = 0; i < primerDiaSemana; i++) dias.push(null)
    for (let i = 1; i <= totalDias; i++) dias.push(i)
    return dias
  }

  const grillaDias = generarGrillaMes()
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  // Lógica para calcular los próximos eventos (15 días)
  const obtenerProximosEventos = () => {
    const eventos = []
    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    const tarjetasCredito = cuentas.filter(c => c.tipo === 'credito')

    tarjetasCredito.forEach(tarjeta => {
      // Calcular próxima fecha de Pago
      if (tarjeta.dia_pago) {
        let fechaPago = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), tarjeta.dia_pago)
        if (fechaPago < fechaActual) {
          fechaPago = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, tarjeta.dia_pago)
        }
        const diasFaltantes = Math.ceil((fechaPago - fechaActual) / (1000 * 60 * 60 * 24))
        if (diasFaltantes <= 15) {
          eventos.push({ tipo: 'Pago', tarjeta, fecha: fechaPago, diasFaltantes })
        }
      }

      // Calcular próxima fecha de Corte
      if (tarjeta.dia_corte) {
        let fechaCorte = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), tarjeta.dia_corte)
        if (fechaCorte < fechaActual) {
          fechaCorte = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, tarjeta.dia_corte)
        }
        const diasFaltantes = Math.ceil((fechaCorte - fechaActual) / (1000 * 60 * 60 * 24))
        if (diasFaltantes <= 15) {
          eventos.push({ tipo: 'Corte', tarjeta, fecha: fechaCorte, diasFaltantes })
        }
      }
    })

    return eventos.sort((a, b) => a.diasFaltantes - b.diasFaltantes)
  }

  const proximosEventos = obtenerProximosEventos()

  if (loading) return <div style={{ padding: '40px' }}>Cargando calendario...</div>

  return (
    <div className="container-calendario" style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* BLOQUE DE ESTILOS INFALIBLE */}
      <style>{`
        @media (max-width: 768px) {
          .container-calendario { padding: 15px !important; padding-top: 70px !important; }
          .scroll-calendario { overflow-x: auto !important; padding-bottom: 10px; }
          .grid-calendario { min-width: 650px !important; } /* Evita que los días se aplasten */
        }
      `}</style>

      {/* Encabezado y Leyenda */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 5px 0' }}>Calendario de Pagos</h2>
        <p style={{ color: '#6b7280', margin: '0 0 15px 0' }}>Fechas de corte y pago de tus tarjetas</p>
        
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#6b7280', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            Fecha de corte
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            Fecha de pago
          </div>
        </div>
      </div>

      {/* Alerta de Próximos 15 días */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '30px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} color="#eab308" />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Próximos 15 días</h4>
        </div>
        
        {proximosEventos.length === 0 ? (
          <div style={{ padding: '20px', color: '#6b7280', fontSize: '14px' }}>No hay eventos próximos.</div>
        ) : (
          <div>
            {proximosEventos.map((evento, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: idx === proximosEventos.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ backgroundColor: evento.tipo === 'Pago' ? '#dcfce7' : '#fee2e2', color: evento.tipo === 'Pago' ? '#16a34a' : '#ef4444', padding: '10px', borderRadius: '10px' }}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>
                      {evento.tipo} {evento.tarjeta.nombre}
                    </h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                      {evento.fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })} · Saldo: {formatearSoles(evento.tarjeta.saldo)}
                    </p>
                  </div>
                </div>
                <div>
                  {evento.diasFaltantes === 0 ? (
                    <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Hoy</span>
                  ) : (
                    <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>En {evento.diasFaltantes}d</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendario con scroll lateral */}
      <div className="scroll-calendario" style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '40px', overflowX: 'auto', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        
        <div className="grid-calendario">
          {/* Controles del mes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <button onClick={() => cambiarMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><ChevronLeft size={20}/></button>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827', textTransform: 'capitalize' }}>{nombreMesVisible}</h3>
            <button onClick={() => cambiarMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><ChevronRight size={20}/></button>
          </div>

          {/* Cabecera días de la semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            {diasSemana.map(dia => (
              <div key={dia} style={{ padding: '12px 10px', textAlign: 'center', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                {dia}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {grillaDias.map((dia, idx) => {
              const esHoy = dia === hoy.getDate() && mesVisible === hoy.getMonth() && anioVisible === hoy.getFullYear()
              
              // Buscar eventos para este día
              const tarjetasCredito = cuentas.filter(c => c.tipo === 'credito')
              const pagosHoy = tarjetasCredito.filter(c => c.dia_pago === dia)
              const cortesHoy = tarjetasCredito.filter(c => c.dia_corte === dia)

              return (
                <div key={idx} style={{ minHeight: '100px', padding: '10px', borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', backgroundColor: dia ? 'white' : '#f9fafb' }}>
                  {dia && (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ 
                          display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '28px', height: '28px', borderRadius: '50%', fontSize: '13px', fontWeight: esHoy ? 'bold' : '500', 
                          backgroundColor: esHoy ? '#6d28d9' : 'transparent', color: esHoy ? 'white' : '#111827' 
                        }}>
                          {dia}
                        </span>
                      </div>
                      
                      {/* Eventos del día */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pagosHoy.map(c => (
                          <div key={`p-${c.id}`} style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.nombre}
                          </div>
                        ))}
                        {cortesHoy.map(c => (
                          <div key={`c-${c.id}`} style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.nombre}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Resumen de Tarjetas */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Resumen de tarjetas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {cuentas.map(cuenta => (
            <div key={cuenta.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: `${cuenta.color}20`, color: cuenta.color, padding: '10px', borderRadius: '10px' }}>
                  {cuenta.tipo === 'credito' ? <CreditCard size={20} /> : cuenta.tipo === 'ahorro' ? <PiggyBank size={20} /> : <Wallet size={20} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{cuenta.nombre}</h4>
                  {cuenta.tipo === 'credito' && (
                    <div style={{ fontSize: '11px', fontWeight: '500', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#ef4444' }}>Corte <span style={{ color: '#6b7280' }}>día {cuenta.dia_corte || '-'}</span></span>
                      <span style={{ color: '#10b981' }}>Pago <span style={{ color: '#6b7280' }}>día {cuenta.dia_pago || '-'}</span></span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{formatearSoles(cuenta.saldo)}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>saldo</div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  )
}