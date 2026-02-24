'use server'

// O envio de push notifications é gerenciado pelo backend Django (pywebpush).
// O registro e remoção de subscriptions é feito diretamente pelo componente
// PushNotificationManager via fetch para /api/v1/notifications/subscribe/.
//
// Este arquivo é mantido por compatibilidade caso seja necessário disparar
// notificações a partir de Server Actions no futuro.

export async function sendBroadcastNotification(title: string, body: string, data: Record<string, unknown> = {}) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) {
    return { success: false, error: 'Não autenticado' }
  }

  const res = await fetch(`${process.env.BACKEND_URL}/notifications/broadcast/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, body, data }),
  })

  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}` }
  }

  const result = await res.json()
  return { success: true, sent_to: result.sent_to }
}
