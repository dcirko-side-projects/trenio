import { useEffect, useState } from 'react'
import { updatePushDevice } from './data'

export const taskPushPublicKey = import.meta.env.VITE_TASK_PUSH_PUBLIC_KEY?.trim()

export function PushDevice() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  useEffect(() => {
    if (!supported) return
    let active = true
    void (async () => {
      try {
        await navigator.serviceWorker.register('/task-push-sw.js')
        const worker = await navigator.serviceWorker.ready
        const device = await worker.pushManager.getSubscription()
        const registered = device ? await updatePushDevice(device.endpoint) : false
        if (active) { setSubscription(device); setEnabled(registered && Notification.permission === 'granted'); setRegistration(worker) }
      } catch { if (active) setError('Postavke push obavijesti nije moguće učitati. Ponovno otvori zadatak.') }
    })()
    return () => { active = false }
  }, [supported])

  async function toggle() {
    if (!registration || !taskPushPublicKey || busy) return
    setBusy(true)
    setError('')
    try {
      if (enabled && subscription) {
        await updatePushDevice(subscription.endpoint, undefined, true)
        setEnabled(false)
        if (await subscription.unsubscribe().catch(() => false)) setSubscription(null)
      } else {
        const device = subscription ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: taskPushPublicKey })
        if (Notification.permission !== 'granted') throw new Error('Permission required')
        setSubscription(device)
        await updatePushDevice(device.endpoint, device.toJSON())
        setEnabled(true)
      }
    } catch {
      setError(Notification.permission === 'denied'
        ? 'Dopusti obavijesti za Trenio u postavkama preglednika ili uređaja.'
        : 'Postavku push obavijesti nije moguće spremiti. Pokušaj ponovno.')
    } finally { setBusy(false) }
  }

  if (!supported) return <p className="quiet">Za primanje koristi Trenio u pregledniku koji podržava push obavijesti.</p>
  return <div className="push-device">
    {error && <p className="error" role="alert">{error}</p>}
    <button type="button" className="text-button" disabled={!registration || busy} onClick={() => void toggle()}>
      {enabled ? 'Isključi push na ovom uređaju' : 'Uključi push na ovom uređaju'}
    </button>
    <p className="quiet">{enabled ? 'Push je uključen na ovom uređaju.' : 'Uključi na mobitelu na kojem želiš primati podsjetnike.'} U obavijesti se prikazuje naziv zadatka.</p>
  </div>
}
