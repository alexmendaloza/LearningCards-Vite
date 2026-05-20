import { renderNavbar } from '../components/navbar.jsx'
import { getSession, setSession } from '../store.jsx'

export function renderAuth(defaultTab = 'login') {
  const app = document.getElementById('app')

  app.innerHTML = `
    <div class="auth-page page">
      ${renderNavbar({ page: 'auth' })}

      <div class="auth-content">
        <!-- ── Left panel ── -->
        <div class="auth-left">
          <div class="auth-left-tag">✦ NovaLearn · LearningCards</div>
          <h2 class="auth-left-title">
            Aprende más rápido<br>con <em>tarjetas que</em><br>se quedan contigo
          </h2>
          <p class="auth-left-desc">
            Estudia con el método de repetición espaciada,
            mantén tu racha y comparte tus mazos con la comunidad.
          </p>
          <div class="auth-stats">
            <div class="auth-stat">
              <div class="auth-stat-num">∞</div>
              <div class="auth-stat-label">Mazos gratis</div>
            </div>
            <div class="auth-stat">
              <div class="auth-stat-num">🔥</div>
              <div class="auth-stat-label">Racha diaria</div>
            </div>
            <div class="auth-stat">
              <div class="auth-stat-num">🛍</div>
              <div class="auth-stat-label">Marketplace</div>
            </div>
          </div>
        </div>

        <!-- ── Right panel ── -->
        <div class="auth-right">
          <div class="auth-form-wrap">
            <h2 class="auth-form-title">Comenzar</h2>
            <p class="auth-form-sub">Inicia sesión o crea una cuenta nueva.</p>

            <!-- Tabs -->
            <div class="auth-tabs">
              <button class="auth-tab ${defaultTab === 'login' ? 'active' : ''}"
                      id="tab-login" onclick="switchTab('login')">
                Iniciar sesión
              </button>
              <button class="auth-tab ${defaultTab === 'register' ? 'active' : ''}"
                      id="tab-register" onclick="switchTab('register')">
                Registrarse
              </button>
            </div>

            <!-- Error area -->
            <div id="auth-error" class="form-error" style="display:none"></div>

            <!-- ── LOGIN FORM ── -->
            <div id="form-login" style="${defaultTab === 'login' ? '' : 'display:none'}">
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input class="form-input" type="email" id="login-email"
                       placeholder="estudiante@ejemplo.com" autocomplete="email" />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input class="form-input" type="password" id="login-password"
                       placeholder="••••••••" autocomplete="current-password" />
              </div>
              <div class="form-row">
                <label class="form-checkbox-label">
                  <input type="checkbox" id="remember" />
                  Recordarme
                </label>
                <span class="form-link">¿Olvidaste tu contraseña?</span>
              </div>
              <button class="btn-submit" onclick="handleLogin()">
                Iniciar sesión
              </button>
              <p class="form-divider">
                ¿No tienes cuenta?
                <span class="form-link" onclick="switchTab('register')">Regístrate aquí</span>
              </p>
            </div>

            <!-- ── REGISTER FORM ── -->
            <div id="form-register" style="${defaultTab === 'register' ? '' : 'display:none'}">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Usuario</label>
                  <input class="form-input" type="text" id="reg-username"
                         placeholder="Zalo123" autocomplete="username" />
                </div>
                <div class="form-group">
                  <label class="form-label">Género</label>
                  <select class="form-select" id="reg-genero">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Nombre completo</label>
                <input class="form-input" type="text" id="reg-nombre"
                       placeholder="Gonzalo Fletes" autocomplete="name" />
              </div>
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input class="form-input" type="email" id="reg-email"
                       placeholder="estudiante@ejemplo.com" autocomplete="email" />
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Contraseña</label>
                  <input class="form-input" type="password" id="reg-password"
                         placeholder="••••••••" autocomplete="new-password" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nacimiento</label>
                  <input class="form-input" type="date" id="reg-fecha" />
                </div>
              </div>
              <p class="form-terms">
                Al registrarte aceptas los
                <a href="#">Términos de Servicio</a> y la
                <a href="#">Política de Privacidad</a> de LearningCards.
              </p>
              <button class="btn-submit" onclick="handleRegister()">
                Crear cuenta gratis
              </button>
              <p class="form-divider">
                ¿Ya tienes cuenta?
                <span class="form-link" onclick="switchTab('login')">Inicia sesión</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `

  // ── Tab switching ──────────────────────────────────────────
  window.switchTab = (tab) => {
    const isLogin = tab === 'login'
    document.getElementById('form-login').style.display    = isLogin ? '' : 'none'
    document.getElementById('form-register').style.display = isLogin ? 'none' : ''
    document.getElementById('tab-login').classList.toggle('active', isLogin)
    document.getElementById('tab-register').classList.toggle('active', !isLogin)
    document.getElementById('auth-error').style.display = 'none'
  }

  // ── Login handler ──────────────────────────────────────────
  window.handleLogin = () => {
    const email    = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value

    if (!email || !password) {
      showAuthError('Por favor completa todos los campos.')
      return
    }

    // Simulate auth — check if user is in sessionStorage
    const users = JSON.parse(localStorage.getItem('lc_users') || '[]')
    const user  = users.find(u => u.email === email && u.password === password)

    if (!user) {
      showAuthError('Credenciales incorrectas. ¿No tienes cuenta? Regístrate.')
      return
    }

    setSession(user)
    showToast('¡Bienvenido de vuelta, ' + user.nombre.split(' ')[0] + '! 👋', 'success')
    navigate('/dashboard')
  }

  // ── Register handler ───────────────────────────────────────
  window.handleRegister = () => {
    const username = document.getElementById('reg-username').value.trim()
    const nombre   = document.getElementById('reg-nombre').value.trim()
    const email    = document.getElementById('reg-email').value.trim()
    const password = document.getElementById('reg-password').value
    const fecha    = document.getElementById('reg-fecha').value
    const genero   = document.getElementById('reg-genero').value

    if (!username || !nombre || !email || !password || !fecha) {
      showAuthError('Por favor completa todos los campos obligatorios.')
      return
    }

    if (password.length < 6) {
      showAuthError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    const users = JSON.parse(localStorage.getItem('lc_users') || '[]')

    if (users.find(u => u.email === email)) {
      showAuthError('Ya existe una cuenta con ese correo electrónico.')
      return
    }

    const newUser = {
      id: Date.now(),
      username, nombre, email, password,
      fechanac: fecha, genero,
      rachaActual: 0,
      total_estudiadas: 0,
      aciertos_totales: 0,
      mazos: []
    }

    users.push(newUser)
    localStorage.setItem('lc_users', JSON.stringify(users))
    setSession(newUser)

    showToast('¡Cuenta creada! Bienvenido/a, ' + nombre.split(' ')[0] + ' 🎉', 'success')
    navigate('/dashboard')
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error')
  el.textContent = msg
  el.style.display = 'block'
}