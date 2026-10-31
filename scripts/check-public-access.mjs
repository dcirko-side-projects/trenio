import { createClient } from '@supabase/supabase-js'

process.loadEnvFile(new URL('../.env', import.meta.url))
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Set the project URL and publishable key in .env first.')

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
for (const table of ['categories', 'tasks', 'notes']) {
  const { error, status } = await client.from(table).select('id').limit(1)
  if (!error || ![401, 403].includes(status)) throw new Error(`Anonymous access to ${table} was not denied as expected (HTTP ${status}).`)
  console.log(`PASS: anonymous access to ${table} denied (HTTP ${status}).`)
}

const settingsResponse = await fetch(new URL('/auth/v1/settings', url), { headers: { apikey: key } })
if (!settingsResponse.ok) throw new Error('Could not verify public Auth settings.')
const settings = await settingsResponse.json()
if (settings.disable_signup !== true) throw new Error('Public signup is not disabled.')
if (settings.external?.anonymous_users === true) throw new Error('Anonymous sign-in is enabled.')
console.log('PASS: public signup and anonymous sign-in are disabled.')
