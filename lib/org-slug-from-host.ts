// Extrae el slug de organización del subdominio (ej: "corrientes" de corrientes.tudominio.com)
export function getOrgSlugFromHost(host: string | null, rootDomain: string | undefined): string | null {
  if (!rootDomain || !host) return null
  const hostname = host.split(':')[0].toLowerCase()
  const root = rootDomain.toLowerCase()
  if (hostname === root || hostname === `www.${root}`) return null
  if (!hostname.endsWith(`.${root}`)) return null
  return hostname.slice(0, -(root.length + 1))
}
