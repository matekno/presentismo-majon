import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

export const R2_BUCKET = process.env.R2_BUCKET ?? ''

let client: S3Client | null = null

// Cliente perezoso: si las variables no están configuradas, r2Configurado() es false
// y las rutas responden 503 en vez de romper el build.
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return client
}

export function r2Configurado(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      R2_BUCKET
  )
}

export async function subirObjeto(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function obtenerObjeto(key: string) {
  return getClient().send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
  )
}

export async function borrarObjeto(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
  )
}

// Borra sin propagar el error: usado al reemplazar una foto, donde un huérfano
// en R2 es preferible a fallar la operación completa.
export async function borrarObjetoSilencioso(key: string): Promise<void> {
  try {
    await borrarObjeto(key)
  } catch (error) {
    console.error('Error borrando objeto de R2:', key, error)
  }
}
