// ── Simple SPA Router ──────────────────────────────────────────
import { renderLanding  } from './pages/landing.jsx'
import { renderAuth     } from './pages/auth.jsx'
import { renderDashboard} from './pages/dashboard.jsx'

const routes = {
  '/'         : renderLanding,
  '/login'    : () => renderAuth('login'),
  '/register' : () => renderAuth('register'),
  '/dashboard': renderDashboard,
}

function navigate(path) {
  history.pushState({}, '', path)
  render(path)
}

function render(path) {
  const app = document.getElementById('app')
  const handler = routes[path] || routes['/']
  app.innerHTML = ''
  handler()
}

// Expose globally
window.navigate = navigate

window.addEventListener('popstate', () => render(location.pathname))

// Initial render
render(location.pathname)