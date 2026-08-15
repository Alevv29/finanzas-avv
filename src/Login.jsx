import { useState } from 'react'
import { supabase } from './supabase'

const traducirError = (mensajeIngles) => {
  const traducciones = {
    "For security purposes, you can only request this after": "Por seguridad, debes esperar unos segundos antes de volver a intentarlo.",
    "Invalid login credentials": "El correo o la contraseña son incorrectos.",
    "User already registered": "Este correo electrónico ya está registrado.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
    "Email not confirmed": "Debes confirmar tu correo electrónico antes de iniciar sesión.",
  };
  for (const [ingles, espanol] of Object.entries(traducciones)) {
    if (mensajeIngles.includes(ingles)) return espanol;
  }
  return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
}

export default function Login() {
  const [esRegistro, setEsRegistro] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')

    if (esRegistro) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre_completo: nombre } }
      })
      if (error) {
        setMensaje(traducirError(error.message))
      } else {
        setMensaje('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.')
        setEsRegistro(false)
        setPassword('')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMensaje(traducirError(error.message))
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <div style={{ padding: '40px', width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#6d28d9', padding: '12px', borderRadius: '12px', color: 'white', display: 'inline-block', marginBottom: '15px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          </div>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>Finanzas AVV</h2>
          <p style={{ color: '#6b7280', marginTop: '5px', fontSize: '14px' }}>
            {esRegistro ? 'Crea tu cuenta para empezar' : 'Inicia sesión en tu panel'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {esRegistro && (
            <input
              type="text"
              placeholder="Nombre Completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
            />
          )}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#6d28d9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
            {loading ? 'Procesando...' : (esRegistro ? 'Registrarse' : 'Entrar')}
          </button>
        </form>

        {mensaje && (
          <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', fontSize: '14px', backgroundColor: mensaje.includes('exitoso') ? '#dcfce7' : '#fee2e2', color: mensaje.includes('exitoso') ? '#166534' : '#991b1b', textAlign: 'center' }}>
            {mensaje}
          </div>
        )}

        <button onClick={() => { setEsRegistro(!esRegistro); setMensaje(''); }} style={{ width: '100%', marginTop: '20px', background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', fontSize: '14px' }}>
          {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </button>
      </div>
    </div>
  )
}