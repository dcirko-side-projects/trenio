import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { timingSafeEqual } from 'node:crypto'
import webPush from 'npm:web-push@3.6.7'

type Delivery = {
  task_id: string
  task_title: string
  remind_at: string
  attempt: number
  subscription: Parameters<typeof webPush.sendNotification>[0]
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  const encoder = new TextEncoder()
  const secret = encoder.encode(Deno.env.get('TASK_PUSH_CRON_SECRET') ?? '')
  const received = encoder.encode(request.headers.get('x-trenio-cron-secret') ?? '')
  if (!secret.length || secret.length !== received.length || !timingSafeEqual(secret, received)) {
    return new Response(null, { status: 401 })
  }

  const publicKey = Deno.env.get('TASK_PUSH_PUBLIC_KEY')
  const privateKey = Deno.env.get('TASK_PUSH_PRIVATE_KEY')
  if (!publicKey || !privateKey) return new Response(null, { status: 503 })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await db.rpc('claim_task_push')
  if (error) return new Response(null, { status: 503 })
  const results = await Promise.all((data as Delivery[]).map(async delivery => {
    let outcome = 'sent'
    try {
      await webPush.sendNotification(delivery.subscription, JSON.stringify({
        taskId: delivery.task_id,
        title: delivery.task_title,
        remindAt: delivery.remind_at,
      }), {
        vapidDetails: { subject: 'https://trenio.pages.dev', publicKey, privateKey },
        TTL: 900,
        urgency: 'high',
        timeout: 8000,
      })
    } catch (failure) {
      const status = (failure as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) outcome = 'expired'
      else if (status === 400 || status === 413) outcome = 'rejected'
      else return false
    }
    const { error } = await db.rpc('finish_task_push', {
      target_id: delivery.task_id, scheduled_at: delivery.remind_at, attempt: delivery.attempt,
      outcome, endpoint: delivery.subscription.endpoint,
    })
    return !error
  }))
  return Response.json({ claimed: results.length, failed: results.filter(ok => !ok).length })
})
