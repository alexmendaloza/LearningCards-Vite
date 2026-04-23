import { renderNavbar } from '../components/navbar.jsx'

export function renderLanding() {
  const app = document.getElementById('app')

  app.innerHTML = `
    <div class="landing page">
      ${renderNavbar({ page: 'landing' })}

      <!-- ── HERO ── -->
      <section class="hero">
        <div class="hero-left">
          <div class="hero-tag">
            <span class="hero-tag-dot"></span>
            Plataforma de aprendizaje activo
          </div>
          <h1 class="hero-title">
            Domina cualquier<br><em>materia</em> con<br>tarjetas inteligentes
          </h1>
          <p class="hero-sub">
            Crea mazos, estudia con el modo interactivo,
            mantén tu racha diaria y descubre el marketplace de la comunidad.
          </p>
          <div class="hero-cta">
            <button class="btn-hero" onclick="navigate('/register')">
              Empezar gratis →
            </button>
            <button class="btn-hero-outline" onclick="navigate('/login')">
              Ya tengo cuenta
            </button>
          </div>
          <div class="hero-badges">
            <div class="hero-badge">
              <div class="hero-badge-icon">🎁</div>
              <div>
                <div style="font-weight:700;font-size:0.82rem;color:var(--ink)">100% Gratis</div>
                <div style="font-size:0.72rem;color:var(--ink-3)">Para siempre</div>
              </div>
            </div>
            <div class="hero-badge">
              <div class="hero-badge-icon">⚡</div>
              <div>
                <div style="font-weight:700;font-size:0.82rem;color:var(--ink)">Acceso inmediato</div>
                <div style="font-size:0.72rem;color:var(--ink-3)">Sin tarjeta de crédito</div>
              </div>
            </div>
            <div class="hero-badge">
              <div class="hero-badge-icon">🌍</div>
              <div>
                <div style="font-weight:700;font-size:0.82rem;color:var(--ink)">Comunidad</div>
                <div style="font-size:0.72rem;color:var(--ink-3)">Marketplace activo</div>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-card-wrap">
            <div class="hero-card-bg"></div>
            <div class="hero-card">
              <div class="hero-card-header">
                <span class="hero-card-badge">MODO ESTUDIO</span>
                <span class="hero-card-count">8 / 20 tarjetas</span>
              </div>
              <div class="hero-card-progress">
                <div class="hero-card-progress-fill"></div>
              </div>
              <div class="hero-flashcard">
                <div class="hero-flashcard-label">Pregunta</div>
                <div class="hero-flashcard-q">
                  ¿Cuál es la central energética de la célula?
                </div>
              </div>
              <div class="hero-card-btns">
                <button class="hero-btn-fail">✗ No lo sé</button>
                <button class="hero-btn-pass">✓ ¡Lo sé!</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── FEATURES ── -->
      <section class="features">
        <div class="features-inner">
          <div class="features-header">
            <div class="section-label">¿Por qué LearningCards?</div>
            <h2 class="section-title">Todo lo que necesitas<br>para estudiar mejor</h2>
            <p class="section-sub">Una plataforma pensada para construir hábitos reales de aprendizaje.</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎁</div>
              <div class="feature-title">Acceso Gratuito</div>
              <div class="feature-desc">Mazos y tarjetas ilimitadas sin costos ocultos ni suscripciones.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <div class="feature-title">Simple e Intuitivo</div>
              <div class="feature-desc">Interfaz limpia pensada para que estudies sin distracciones.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🛍</div>
              <div class="feature-title">Marketplace</div>
              <div class="feature-desc">Accede a miles de mazos creados por la comunidad o publica los tuyos.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔥</div>
              <div class="feature-title">Racha Diaria</div>
              <div class="feature-desc">Mantén tu racha y construye hábitos de estudio constantes.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CTA ── -->
      <section class="cta-section">
        <div class="cta-inner">
          <div class="cta-box">
            <h2 class="cta-title">¿Listo para transformar<br>tu aprendizaje?</h2>
            <p class="cta-sub">Únete a miles de estudiantes que dominan sus materias con LearningCards.</p>
            <button class="btn-cta" onclick="navigate('/register')">
              Crear cuenta gratis →
            </button>
            <p class="cta-note">Sin tarjeta de crédito · Gratis para siempre</p>
          </div>
        </div>
      </section>

      <footer class="footer">
        © 2026 NovaLearn · LearningCards — Empowering students worldwide.
      </footer>
    </div>
  `
}