import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider, getAuth, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut,
  type Auth, type User,
} from 'firebase/auth'
import {
  collection, doc, initializeFirestore, onSnapshot, persistentLocalCache,
  persistentMultipleTabManager, setDoc, type Firestore,
} from 'firebase/firestore'
import { EMPTY_STATE, type DataState } from '../domain/types'
import type { Repo } from './repo'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

function init() {
  if (!app) {
    app = initializeApp(config)
    auth = getAuth(app)
    // Caché persistente: la app funciona sin conexión y sincroniza al volver
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    })
  }
  return { auth: auth!, db: db! }
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(init().auth, cb)
}

// Abierta desde la pantalla de inicio (iOS y Android): allí la ventana emergente de Google no vuelve a la app
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

const POPUP_UNAVAILABLE = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment']

export async function signInWithGoogle(): Promise<void> {
  const { auth } = init()
  const provider = new GoogleAuthProvider()
  if (isStandalone()) return signInWithRedirect(auth, provider)
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    // Navegador que bloquea la ventana emergente: se hace el mismo login por redirección
    if (POPUP_UNAVAILABLE.includes((err as { code?: string }).code ?? '')) return signInWithRedirect(auth, provider)
    throw err
  }
}

// Al volver de la redirección, el login correcto llega por watchAuth; aquí solo se recoge el error
export async function redirectSignInError(): Promise<boolean> {
  try {
    await getRedirectResult(init().auth)
    return false
  } catch {
    return true
  }
}

export async function logout(): Promise<void> {
  await signOut(init().auth)
}

const COLLECTIONS = ['habits', 'months', 'days', 'metrics'] as const

export function createFirebaseRepo(uid: string): Repo {
  const { db } = init()
  const base = `users/${uid}`

  return {
    mode: 'firebase',
    subscribe(listener) {
      let state: DataState = EMPTY_STATE
      const unsubs = COLLECTIONS.map((name) =>
        onSnapshot(collection(db, base, name), (snap) => {
          const docs = Object.fromEntries(snap.docs.map((d) => [d.id, { ...d.data(), id: d.id }]))
          state = { ...state, [name]: docs }
          listener(state)
        }),
      )
      return () => unsubs.forEach((u) => u())
    },
    async saveHabit(habit) {
      await setDoc(doc(db, base, 'habits', habit.id), habit)
    },
    async saveMonth(page) {
      await setDoc(doc(db, base, 'months', page.id), page)
    },
    async saveMetric(metric) {
      await setDoc(doc(db, base, 'metrics', metric.id), metric)
    },
    async patchDay(date, patch) {
      // merge: true fusiona los mapas anidados (habitsDone, ratings) en Firestore
      await setDoc(doc(db, base, 'days', date), { ...patch, updatedAt: Date.now() }, { merge: true })
    },
  }
}
