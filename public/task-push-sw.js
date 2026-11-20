const isTaskId = id => typeof id === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
const reminderBodies = new Map([
  ['before_due', 'Trenio · Rok je za tri dana'],
  ['due_today', 'Trenio · Rok je danas'],
  ['overdue', 'Trenio · Rok je istekao'],
])

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()))

self.addEventListener('push', event => {
  let reminder
  try { reminder = event.data?.json() } catch { return }
  if (!isTaskId(reminder?.taskId) || typeof reminder.title !== 'string' || !reminder.title.trim()) return
  event.waitUntil(self.registration.showNotification(reminder.title, {
    body: reminderBodies.get(reminder.kind) ?? 'Trenio · Podsjetnik za zadatak',
    icon: '/icons/trenio-192.png',
    tag: `task-${reminder.taskId}-${reminder.remindAt}`,
    data: { taskId: reminder.taskId },
  }))
})

self.addEventListener('notificationclick', event => {
  const taskId = event.notification.data?.taskId
  event.notification.close()
  if (!isTaskId(taskId)) return
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const app = windows.find(client => new URL(client.url).pathname === '/')
    if (app) {
      await app.focus()
      app.postMessage({ type: 'trenio-task-reminder', taskId })
    } else {
      await self.clients.openWindow(`/#task=${taskId}`)
    }
  })())
})
