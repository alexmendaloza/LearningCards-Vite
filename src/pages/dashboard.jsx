import { renderNavbar } from '../components/navbar.jsx'
import { getSession } from '../store.jsx'

export function renderDashboard() {
  const app = document.getElementById('app')
  const user = getSession()

  // Guard: redirect to login if no session
  if (!user) {
    navigate('/login')
    return
  }

  const genero = user.genero || 'M'
  const saludo = genero === 'F' ? 'Bienvenida' : 'Bienvenido'
  const primer = user.nombre ? user.nombre.split(' ')[0] : 'Estudiante'
  const iniciales = getInitials(user.nombre)

  const mazos = user.mazos || []
  const precision = user.total_estudiadas > 0
    ? Math.round((user.aciertos_totales / user.total_estudiadas) * 100)
    : 0

  app.innerHTML = `
    <div class="dashboard page">
      ${renderNavbar({ page: 'dashboard', user, iniciales })}

      <div class="dashboard-content">
        <!-- Welcome -->
        <div class="welcome-banner">
          <h1>¡${saludo} de vuelta, ${primer}! 👋</h1>
          <p>Continuemos tu camino de aprendizaje</p>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card fire">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${user.rachaActual ?? 0}</div>
            <div class="stat-label">Días de racha</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">${user.total_estudiadas ?? 0}</div>
            <div class="stat-label">Tarjetas estudiadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">${precision}%</div>
            <div class="stat-label">Precisión promedio</div>
          </div>
        </div>

        <!-- Main grid -->
        <div class="dashboard-grid">
          <!-- Mazos column -->
          <div>
            <div class="section-heading">
              <h2>Mis Mazos</h2>
              <button class="btn-new" onclick="showNewDeckModal()">
                + Nuevo Mazo
              </button>
            </div>

            <div class="deck-list" id="deck-list">
              ${mazos.length === 0 ? renderEmptyDecks() : mazos.map(renderDeckCard).join('')}
            </div>
          </div>

          <!-- Sidebar -->
          <div class="dashboard-sidebar">
            <div class="sidebar-widget">
              <div class="widget-title">🏆 Logros</div>
              <div class="widget-empty">
                Sigue estudiando para desbloquear logros.
              </div>
            </div>

            <div class="sidebar-widget">
              <div class="widget-title">🛍 Explorar Marketplace</div>
              <div class="widget-empty">
                Próximamente — descubre mazos de la comunidad.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Deck Modal -->
    <div id="modal-overlay" class="modal-overlay" style="display:none" onclick="closeModal(event)">
      <div class="modal-box" onclick="event.stopPropagation()">
        <h3 class="modal-title">Nuevo Mazo</h3>
        <p class="modal-sub">Dale un nombre a tu nuevo mazo de flashcards.</p>
        <div class="form-group" style="margin-top:1.25rem">
          <label class="form-label">Título *</label>
          <input class="form-input" type="text" id="new-deck-title" placeholder="Ej: Biología Molecular" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Descripción <span style="color:var(--ink-3);font-weight:400">(opcional)</span></label>
          <textarea class="form-input" id="new-deck-desc" rows="3" placeholder="Describe el tema del mazo..."></textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:1.5rem">
          <button class="btn-ghost" style="flex:1;padding:11px" onclick="closeDeckModal()">Cancelar</button>
          <button class="btn-submit" style="margin-top:0;flex:1;padding:11px" onclick="createDeck()">Crear Mazo</button>
        </div>
      </div>
    </div>
  `

  injectModalStyles()
  bindDashboardEvents(user)
}

function renderDeckCard(mazo) {
  return `
    <div class="deck-card" id="deck-${mazo.id}">
      <div class="deck-card-bar"></div>
      <div class="deck-card-body">
        <div class="deck-card-icon">📚</div>
        <div class="deck-card-info">
          <div class="deck-card-title">${mazo.titulo}</div>
          <div class="deck-card-meta">
            ${mazo.descripcion || 'Sin descripción'} &nbsp;·&nbsp; ${mazo.tarjetas?.length ?? 0} tarjetas
          </div>
        </div>
        <div class="deck-card-actions">
          <button class="deck-btn deck-btn-study" onclick="studyDeck(${mazo.id})">Estudiar</button>
          <button class="deck-btn deck-btn-outline" onclick="editDeck(${mazo.id})">Editar</button>
        </div>
      </div>
    </div>
  `
}

function renderEmptyDecks() {
  return `
    <div class="empty-decks">
      <div style="font-size:2.5rem;margin-bottom:0.75rem">📭</div>
      <p>Aún no tienes mazos creados.</p>
      <button class="btn-new" onclick="showNewDeckModal()">
        Crear tu primer mazo
      </button>
    </div>
  `
}

function injectModalStyles() {
  if (document.getElementById('modal-styles')) return
  const style = document.createElement('style')
  style.id = 'modal-styles'
  style.textContent = `
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(13,13,18,0.55);
      backdrop-filter: blur(4px);
      z-index: 500;
      display: flex !important;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: pageFadeIn 0.2s ease both;
    }
    .modal-box {
      background: var(--white);
      border-radius: var(--radius-xl);
      padding: 2rem;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
    }
    .modal-title {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .modal-sub {
      font-size: 0.85rem;
      color: var(--ink-3);
    }
  `
  document.head.appendChild(style)
}

function bindDashboardEvents(user) {
  window.showNewDeckModal = () => {
    const overlay = document.getElementById('modal-overlay')
    overlay.style.display = 'flex'
    setTimeout(() => document.getElementById('new-deck-title')?.focus(), 50)
  }

  window.closeDeckModal = () => {
    document.getElementById('modal-overlay').style.display = 'none'
  }

  window.closeModal = (e) => {
    if (e.target.id === 'modal-overlay') window.closeDeckModal()
  }

  window.createDeck = () => {
    const titulo = document.getElementById('new-deck-title').value.trim()
    const desc   = document.getElementById('new-deck-desc').value.trim()

    if (!titulo) {
      document.getElementById('new-deck-title').focus()
      document.getElementById('new-deck-title').style.borderColor = 'var(--red)'
      return
    }

    // Save to localStorage
    const users = JSON.parse(localStorage.getItem('lc_users') || '[]')
    const idx   = users.findIndex(u => u.id === user.id)

    const newMazo = {
      id: Date.now(),
      titulo,
      descripcion: desc || null,
      tarjetas: []
    }

    if (!users[idx].mazos) users[idx].mazos = []
    users[idx].mazos.push(newMazo)
    localStorage.setItem('lc_users', JSON.stringify(users))

    // Update session
    const updatedUser = users[idx]
    import('../store.jsx').then(({ setSession }) => setSession(updatedUser))

    window.closeDeckModal()
    showToast('¡Mazo "' + titulo + '" creado! 📚', 'success')

    // Re-render deck list
    const list = document.getElementById('deck-list')
    if (list) {
      const mazos = updatedUser.mazos
      list.innerHTML = mazos.map(renderDeckCard).join('')
    }
  }

  window.studyDeck = (id) => {
    showToast('Modo estudio próximamente 🚀', 'success')
  }

  window.editDeck = (id) => {
    showToast('Editor de tarjetas próximamente ✏️', 'success')
  }
}

function getInitials(nombre = '') {
  const p = nombre.trim().split(' ')
  return (p[0]?.[0] ?? '') .toUpperCase() + (p[1]?.[0] ?? '').toUpperCase()
}