// Helpers de fotos de talmidim, compartidos entre las APIs.
//
// Las fotos viven en Cloudflare R2 (bucket privado) y se sirven a través de
// /api/talmidim/[id]/foto, que valida sesión y kitá. En la DB sólo guardamos
// la key del objeto (`fotoKey`).
//
// `fotoUrl` es legacy: las fotos viejas están ahí como data URL base64. Se
// siguen sirviendo tal cual hasta que corra prisma/migrate-fotos-r2.ts.

export const MAX_FOTO_BYTES = 2 * 1024 * 1024

const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function esTipoDeImagenPermitido(contentType: string): boolean {
  return contentType in TIPOS_PERMITIDOS
}

export function extensionParaTipo(contentType: string): string {
  return TIPOS_PERMITIDOS[contentType] ?? 'jpg'
}

export function nuevaFotoKey(talmidId: string, contentType: string): string {
  return `talmidim/${talmidId}/${crypto.randomUUID()}.${extensionParaTipo(contentType)}`
}

// URL que consume el front. Con `updatedAt` como cache-buster, así el browser
// puede cachear agresivamente y aun así ver el cambio al reemplazar la foto.
export function fotoUrlPublica(talmid: {
  id: string
  fotoKey: string | null
  fotoUrl: string | null
  updatedAt: Date
}): string | null {
  if (talmid.fotoKey) {
    return `/api/talmidim/${talmid.id}/foto?v=${talmid.updatedAt.getTime()}`
  }
  return talmid.fotoUrl
}
