import webpush from 'web-push'
import { prisma } from './db'

// Configurar VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@majon.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      },
      JSON.stringify(payload)
    )
    return true
  } catch (error) {
    console.error('Push notification error:', error)
    return false
  }
}

export async function notifyTalmid(talmidId: string, payload: PushPayload): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { talmidId }
  })

  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    )

    // Si falló (suscripción expirada), eliminarla
    if (!success) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
    }
  }
}

export async function queueFeedbackNotifications(claseId: string): Promise<void> {
  // Obtener talmidim que asistieron a la clase
  const asistencias = await prisma.asistencia.findMany({
    where: {
      claseId,
      estado: { in: ['presente', 'tardanza'] }
    },
    select: { talmidId: true }
  })

  const now = new Date()
  const reminder = new Date(now.getTime() + 12 * 60 * 60 * 1000) // +12 horas

  // Crear notificaciones en cola
  for (const { talmidId } of asistencias) {
    await prisma.notificationQueue.createMany({
      data: [
        {
          talmidId,
          claseId,
          tipo: 'inicial',
          scheduledFor: now
        },
        {
          talmidId,
          claseId,
          tipo: 'recordatorio',
          scheduledFor: reminder
        }
      ],
      skipDuplicates: true
    })
  }
}

export async function processNotificationQueue(): Promise<{ sent: number; skipped: number }> {
  const now = new Date()

  // Obtener notificaciones pendientes
  const pendingNotifications = await prisma.notificationQueue.findMany({
    where: {
      sent: false,
      scheduledFor: { lte: now }
    },
    take: 100 // Procesar en lotes
  })

  let sent = 0
  let skipped = 0

  for (const notification of pendingNotifications) {
    // Verificar si el talmid ya dio feedback
    const feedback = await prisma.feedback.findUnique({
      where: {
        talmidId_claseId: {
          talmidId: notification.talmidId,
          claseId: notification.claseId
        }
      }
    })

    if (feedback) {
      // Ya dio feedback, marcar como enviada y saltar
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: { sent: true, sentAt: now }
      })
      skipped++
      continue
    }

    // Obtener datos de la clase
    const clase = await prisma.clase.findUnique({
      where: { id: notification.claseId },
      select: { titulo: true, fecha: true }
    })

    const isReminder = notification.tipo === 'recordatorio'
    const payload: PushPayload = {
      title: isReminder ? 'Recordatorio de feedback' : '¿Cómo estuvo la clase?',
      body: clase?.titulo
        ? `Contanos qué te pareció: ${clase.titulo}`
        : 'Dejá tu feedback de la última clase',
      url: `/feedback/${notification.claseId}`
    }

    await notifyTalmid(notification.talmidId, payload)

    await prisma.notificationQueue.update({
      where: { id: notification.id },
      data: { sent: true, sentAt: now }
    })

    sent++
  }

  return { sent, skipped }
}
