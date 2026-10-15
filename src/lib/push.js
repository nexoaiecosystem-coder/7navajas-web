import { supabase } from './supabase'

export const VAPID_PUBLIC_KEY =
  'BJhl7t_Ny1aA2KGI38O91fNkJ7FfJ__YxRWRcpPoaXl1DGKfWY_FyojgCfI9GI3PHp7EJzqJZWrUI-7Z5MtN3g0'

export const pushDisponible = () =>
  'serviceWorker' in navigator && 'PushManager' in window

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Seguro = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bruto = window.atob(base64Seguro)
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)))
}

export async function suscripcionActual() {
  if (!pushDisponible()) return null
  const registro = await navigator.serviceWorker.register('/sw.js')
  return registro.pushManager.getSubscription()
}

// Pide permiso, se suscribe y guarda la suscripción vinculada a ese email
export async function activarPush(email) {
  const registro = await navigator.serviceWorker.register('/sw.js')
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('Permiso de notificaciones denegado.')

  let sub = await registro.pushManager.getSubscription()
  if (!sub) {
    sub = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscripciones').upsert(
    {
      email,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
  return sub
}

export async function desactivarPush() {
  const sub = await suscripcionActual()
  if (!sub) return
  await supabase.from('push_subscripciones').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}
