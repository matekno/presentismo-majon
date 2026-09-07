// Compresión de fotos en el browser, antes de subirlas a R2.
// Se usa desde los formularios de talmidim (client components).

const MAX_SIZE = 400 // lado más largo, en px
const CALIDAD = 0.8

export function comprimirImagen(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        // Redimensionar manteniendo proporcion
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Error al comprimir la imagen'))
          },
          'image/jpeg',
          CALIDAD
        )
      }
      img.onerror = () => reject(new Error('Error loading image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsDataURL(file)
  })
}

export function validarArchivoDeImagen(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Por favor selecciona una imagen'
  if (file.size > 2 * 1024 * 1024) return 'La imagen es muy grande. Maximo 2MB'
  return null
}

// Sube la foto ya comprimida al talmid. Devuelve la URL para mostrarla.
export async function subirFotoTalmid(talmidId: string, blob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('foto', blob, 'foto.jpg')

  const res = await fetch(`/api/talmidim/${talmidId}/foto`, {
    method: 'POST',
    body: formData,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al subir la foto')

  return json.fotoUrl as string
}

export async function borrarFotoTalmid(talmidId: string): Promise<void> {
  const res = await fetch(`/api/talmidim/${talmidId}/foto`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al borrar la foto')
}
