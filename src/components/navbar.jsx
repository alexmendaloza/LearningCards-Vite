import { getSession, clearSession } from '../store.jsx'

export function renderNavbar({ page, user, iniciales }) {
  const session = user || getSession()
  const isLanding  = page === 'landing'
  const isAuth     = page === 'auth'
  const isDashboard = page === 'dashboard'

  let rightSide = ''

  if (isLanding) {
    rightSide = `
      <div class="navbar-actions">
        <button class="btn-ghost" onclick="navigate('/login')">Iniciar sesión</button>
        <button class="btn-primary" onclick="navigate('/register')">Empezar gratis</button>
      </div>
    `
  } else if (isAuth) {
    rightSide = `
      <div class="navbar-actions">
        <button class="btn-ghost" onclick="navigate('/')">← Volver al inicio</button>
      </div>
    `
  } else if (isDashboard && session) {
    const ini = iniciales || getInitials(session.nombre)
    rightSide = `
      <div class="navbar-actions">
        <button class="btn-ghost" onclick="navigate('/')">Marketplace</button>
        <div class="avatar" id="navbar-avatar">
          ${ini}
          <div class="avatar-menu" id="avatar-menu">
            <div class="avatar-menu-item" style="cursor:default;color:var(--ink-3);font-size:0.75rem">
              ${session.nombre}
            </div>
            <div class="avatar-menu-item" onclick="navigate('/login')">Configuración</div>
            <div class="avatar-menu-item danger" onclick="handleLogout()">Cerrar sesión</div>
          </div>
        </div>
      </div>
    `
  }

  return `
    <nav class="navbar">
      <div class="navbar-brand" onclick="navigate(${session && !isLanding ? "'/dashboard'" : "'/'"})" >
        <div class="navbar-logo">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M12 14l9-5-9-5-9 5 9 5z"/>
            <path d="M12 14l6.16-3.422A12 12 0 0112 21.5a12 12 0 01-6.16-4.922L12 14z"/>
          </svg>
        </div>
        <div>
          <div style="font-size:0.68rem;color:var(--ink-3);font-weight:500;letter-spacing:0.04em">NovaLearn</div>
          <div class="navbar-name">Learning<span>Cards</span></div>
        </div>
      </div>
      ${rightSide}
    </nav>
  `
}

function getInitials(nombre = '') {
  const p = nombre.trim().split(' ')
  return (p[0]?.[0] ?? '').toUpperCase() + (p[1]?.[0] ?? '').toUpperCase()
}

// Bind logout after render
document.addEventListener('click', (e) => {
  if (e.target.closest('#navbar-avatar')) return
  const menu = document.getElementById('avatar-menu')
  // menus manage themselves via CSS hover
})

window.handleLogout = () => {
  clearSession()
  showToast('Sesión cerrada. ¡Hasta pronto! 👋', 'success')
  navigate('/')
}