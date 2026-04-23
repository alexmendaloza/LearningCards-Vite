import { useState } from "react";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("login");

  return (
    <div className="container">
      <div className="card">

        <div className="header">
          <p>¡Bienvenido de vuelta! Continúa tu camino de aprendizaje.</p>
        </div>

        <h2>Comenzar</h2>
        <p className="sub">Inicia sesión o crea una cuenta nueva</p>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={tab === "login" ? "active" : ""}
            onClick={() => setTab("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={tab === "register" ? "active" : ""}
            onClick={() => setTab("register")}
          >
            Registrarse
          </button>
        </div>

        {/* LOGIN */}
        {tab === "login" && (
          <form className="form">
            <label>Correo electrónico</label>
            <input type="email" placeholder="estudiante@ejemplo.com" />

            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" />

            <div className="row">
              <label>
                <input type="checkbox" /> Recordarme
              </label>
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="btn">
              Iniciar sesión
            </button>
          </form>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <form className="form">
            <label>Usuario</label>
            <input type="text" placeholder="usuario123" />

            <label>Nombre completo</label>
            <input type="text" placeholder="Juan Pérez" />

            <label>Correo electrónico</label>
            <input type="email" placeholder="estudiante@ejemplo.com" />

            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" />

            <label>Fecha de nacimiento</label>
            <input type="date" />

            <label>Género</label>
            <select>
              <option>Selecciona una opción</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>

            <label>Foto de perfil</label>
            <input type="file" />

            <label className="terms">
              <input type="checkbox" /> Acepto términos
            </label>

            <button type="submit" className="btn">
              Crear cuenta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}