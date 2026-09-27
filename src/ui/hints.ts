// Pistas de un solo uso (cinta del calendario, pulsación larga…), recordadas en este navegador.
// Sin almacenamiento disponible se dan por vistas, para no repetirlas en cada render.

export function hintSeen(key: string): boolean {
  try { return localStorage.getItem(key) === '1' } catch { return true }
}

export function markHintSeen(key: string) {
  try { localStorage.setItem(key, '1') } catch { /* sin almacenamiento: la pista volverá a salir */ }
}
