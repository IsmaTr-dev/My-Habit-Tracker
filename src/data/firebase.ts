import { initializeApp, type FirebaseApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type Auth, type User } from 'firebase/auth'
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

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(init().auth, new GoogleAuthProvider())
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
