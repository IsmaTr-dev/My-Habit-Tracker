import { useEffect, useState } from 'react'
import { monthOf } from './domain/dates'
import { BottomNav } from './features/Chrome'
import { CalendarSheet } from './features/CalendarSheet'
import { HabitsScreen } from './features/HabitsScreen'
import { MoodScreen } from './features/MoodScreen'
import { NewMonthPage } from './features/NewMonthPage'
import { StatsScreen } from './features/StatsScreen'
import { SketchButton } from './ui/Modal'
import { Ribbon, SketchBox } from './ui/sketch'
import { firebaseConfigured, useApp } from './store'

export function App() {
  const { authReady, user, loaded, data, today, tab, calendar, tick } = useApp()

  // El día lógico se revisa cada minuto y al volver a la app
  useEffect(() => {
    const id = window.setInterval(tick, 60_000)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [tick])

  useEffect(() => {
    if (!firebaseConfigured) return
    let unsub = () => {}
    import('./data/firebase').then(({ watchAuth, createFirebaseRepo }) => {
      unsub = watchAuth((u) => {
        useApp.getState().setUser(u ? { uid: u.uid, name: u.displayName ?? '' } : null, u ? createFirebaseRepo(u.uid) : null)
      })
    })
    return () => unsub()
  }, [])

  let content
  if (!authReady || (user && !loaded)) content = <p className="loading">Abriendo el cuaderno…</p>
  else if (!user) content = <LoginScreen />
  else if (!data.months[monthOf(today)]?.setupDone) content = <NewMonthPage month={monthOf(today)} />
  else content = (
    <>
      {tab === 'habitos' && <HabitsScreen />}
      {tab === 'stats' && <StatsScreen />}
      {tab === 'animo' && <MoodScreen />}
      <BottomNav />
      {calendar && <CalendarSheet view={calendar} />}
    </>
  )

  return (
    <div className="app">
      {/* Filtro "trazo a mano" para los bordes que se dibujan con CSS (cuadrícula de Stats, calendario) */}
      <svg className="svg-defs" aria-hidden="true" focusable="false">
        <filter id="wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {content}
    </div>
  )
}

function LoginScreen() {
  const today = useApp((s) => s.today)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Si se vuelve de la redirección de Google con un error, se muestra aquí
  useEffect(() => {
    import('./data/firebase').then(({ redirectSignInError }) => redirectSignInError()).then((failed) => {
      if (failed) setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
    })
  }, [])

  const login = async () => {
    setError('')
    setBusy(true)
    try {
      const { signInWithGoogle } = await import('./data/firebase')
      await signInWithGoogle()
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
    } finally {
      // Con redirección la promesa no termina (la página se va a Google) y el botón sigue ocupado
      setBusy(false)
    }
  }
  return (
    <main className="screen login">
      {/* Portada: tapa rayada a lápiz con la etiqueta pegada y la cinta asomando */}
      <div className="cover">
        <SketchBox seed="cover" radius={16} fill="var(--pencil-fill)" className="cover-board">
          <SketchBox seed="cover-label" radius={8} fill="var(--paper)" fillStyle="solid" className="cover-label">
            <h1 className="month-title">Mis hábitos</h1>
            <p className="cover-sub">cuaderno de {today.slice(0, 4)}</p>
          </SketchBox>
        </SketchBox>
        <span className="cover-ribbon" aria-hidden="true"><Ribbon length={84} /></span>
      </div>
      <p className="intro">Hábitos, estadísticas y ánimo, como en un cuaderno de papel.</p>
      <SketchButton seed="login" variant="primary" onClick={login} disabled={busy}>
        {busy ? 'Abriendo Google…' : 'Entrar con Google'}
      </SketchButton>
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  )
}
