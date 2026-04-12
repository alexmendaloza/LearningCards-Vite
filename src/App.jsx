import { useState } from 'react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fechaNac: '',
    genero: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Datos del usuario:", formData)
    alert("Formulario enviado")
  }

  return (
    <div className="login-container">
      <h1>Login / Registro</h1>

      <form onSubmit={handleSubmit} className="form">
        
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Contraseña</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label>Fecha de nacimiento</label>
        <input
          type="date"
          name="fechaNac"
          value={formData.fechaNac}
          onChange={handleChange}
          required
        />

        <label>Género</label>
        <select
          name="genero"
          value={formData.genero}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona una opción</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>

        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}

export default App