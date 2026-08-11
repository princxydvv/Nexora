import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = {}
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue
  const i = line.indexOf('=')
  if (i === -1) continue
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
;(async () => {
  // Check tables exist
  for (const t of ['user_profiles', 'subscriptions', 'payments', 'reports', 'webhook_events', 'research_reports']) {
    const { data, error } = await db.from(t).select('*').limit(1)
    console.log(`TABLE ${t}: ${error ? 'ERR ' + error.message : 'OK'}`)
  }
  // Check RPC functions
  for (const fn of ['activate_subscription', 'increment_report_usage', 'reset_monthly_usage', 'check_research_gate']) {
    const { data, error } = await db.rpc(fn, {})
    const errMsg = error ? error.message : 'OK'
    console.log(`RPC ${fn}: ${error ? 'ERR ' + errMsg : 'OK (data=' + JSON.stringify(data).slice(0, 80) + ')'}`)
  }
  process.exit(0)
})().catch(e => { console.error('FATAL', e.message); process.exit(1) })
