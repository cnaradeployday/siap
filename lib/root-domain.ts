// Dominio raíz de la app (ej: "siap.ar"). Configurado vía NEXT_PUBLIC_ROOT_DOMAIN
// una vez que el dominio propio está listo. Sin esta env var, todo sigue
// funcionando igual que antes (sin subdominios por organización).
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN

// Dominio para cookies compartidas entre el dominio raíz y sus subdominios
// (ej: ".siap.ar"), para que la sesión y la organización activa viajen de
// siap.ar a corrientes.siap.ar. `undefined` deja el comportamiento default
// (cookie atada solo al host exacto).
export function getCookieDomain(): string | undefined {
  return ROOT_DOMAIN ? `.${ROOT_DOMAIN}` : undefined
}

export function getOrgUrl(slug: string, path: string = '/dashboard'): string | null {
  if (!ROOT_DOMAIN) return null
  return `https://${slug}.${ROOT_DOMAIN}${path}`
}
