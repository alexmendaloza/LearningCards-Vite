// ── Toast notification system ────────────────────────────────
// Injects a toast container into the DOM and exposes window.showToast()

;(function () {
  // Create container once
  function getContainer() {
    let c = document.getElementById('toast-container')
    if (!c) {
      c = document.createElement('div')
      c.id = 'toast-container'
      Object.assign(c.style, {
        position:      'fixed',
        bottom:        '1.5rem',
        right:         '1.5rem',
        zIndex:        '9999',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.6rem',
        pointerEvents: 'none',
      })
      document.body.appendChild(c)
    }
    return c
  }

  window.showToast = function (msg, type = 'success') {
    const container = getContainer()

    const toast = document.createElement('div')

    const bg = type === 'error'   ? '#ef4444'
             : type === 'warning' ? '#f59e0b'
             :                      '#22c55e'

    Object.assign(toast.style, {
      background:    bg,
      color:         '#fff',
      padding:       '0.75rem 1.25rem',
      borderRadius:  '12px',
      fontSize:      '0.9rem',
      fontWeight:    '600',
      boxShadow:     '0 4px 20px rgba(0,0,0,0.25)',
      opacity:       '0',
      transform:     'translateY(12px)',
      transition:    'opacity 0.3s ease, transform 0.3s ease',
      pointerEvents: 'auto',
      maxWidth:      '320px',
      lineHeight:    '1.4',
    })

    toast.textContent = msg
    container.appendChild(toast)

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity   = '1'
      toast.style.transform = 'translateY(0)'
    })

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity   = '0'
      toast.style.transform = 'translateY(12px)'
      setTimeout(() => toast.remove(), 350)
    }, 3000)
  }
})()
