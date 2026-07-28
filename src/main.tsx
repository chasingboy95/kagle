import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { defaultStorage } from './utils/storage'
import { SESSION_SNAPSHOT_SCHEMA } from './types/training'
import { isTrainingInProgress, requestActivation } from './pwa/swProtocol'

function showUpdatePrompt(activateUpdate: () => void) {
  if (document.getElementById('pwa-update-prompt')) return

  const prompt = document.createElement('div')
  prompt.id = 'pwa-update-prompt'
  prompt.setAttribute('role', 'status')
  prompt.style.cssText = [
    'position:fixed',
    'left:16px',
    'right:16px',
    'bottom:calc(16px + env(safe-area-inset-bottom))',
    'z-index:9999',
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'gap:12px',
    'max-width:520px',
    'margin:0 auto',
    'padding:12px 14px',
    'border:1px solid rgba(148,163,184,.24)',
    'border-radius:16px',
    'background:rgba(15,23,42,.96)',
    'color:#e2e8f0',
    'box-shadow:0 16px 40px rgba(0,0,0,.35)',
    'font:14px/1.4 system-ui,sans-serif',
  ].join(';')

  const text = document.createElement('span')
  text.textContent = '新版本已准备好，可在训练结束后刷新。'

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = '立即更新'
  button.style.cssText = [
    'flex:none',
    'border:0',
    'border-radius:999px',
    'padding:8px 12px',
    'background:#e2e8f0',
    'color:#0f172a',
    'font-weight:700',
    'cursor:pointer',
  ].join(';')
  button.addEventListener('click', () => {
    button.disabled = true
    button.textContent = '更新中…'
    activateUpdate()
  })

  prompt.append(text, button)
  document.body.append(prompt)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let reloading = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })

    // Activate a waiting SW only when the user confirms AND training is not in
    // progress; otherwise defer so an active session is never interrupted.
    const activateUpdate = (registration: ServiceWorkerRegistration) => {
      const snapshot = defaultStorage.read(SESSION_SNAPSHOT_SCHEMA)
      if (isTrainingInProgress(snapshot)) return
      requestActivation(registration)
    }

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdatePrompt(() => activateUpdate(registration))
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (
              worker.state === 'installed'
              && navigator.serviceWorker.controller
              && registration.waiting
            ) {
              showUpdatePrompt(() => activateUpdate(registration))
            }
          })
        })

        return registration.update()
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary onError={() => {
        // Only clear the session snapshot — never touch training history, config,
        // saved favorites, weekly goals, or settings.
        try {
          localStorage.removeItem('kegel.session-snapshot.v1')
        } catch {
          // Storage unavailable — nothing to do
        }
      }}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
