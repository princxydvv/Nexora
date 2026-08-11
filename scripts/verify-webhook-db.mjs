#!/usr/bin/env node
/**
 * Verify webhook_events table, unique constraint, and service_role access.
 * Usage: node scripts/verify-webhook-db.mjs
 *
 * Tests directly against the table (Supabase client can't query information_schema):
 *  1. Insert a probe row → confirms table exists + service_role can insert
 *  2. Insert the same event_id again → confirms UNIQUE constraint (expects 23505)
 *  3. Clean up the probe rows
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    const get = (key) => {
        const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'))
        return match ? match[1].trim() : null
    }
    return {
        url: get('NEXT_PUBLIC_SUPABASE_URL'),
        serviceKey: get('SUPABASE_SERVICE_ROLE_KEY'),
    }
}

async function main() {
    const { url, serviceKey } = loadEnv()
    if (!url || !serviceKey) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
        process.exit(1)
    }

    const db = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    const probeId = `verify_probe_${Date.now()}`

    console.log('══════════════════════════════════════════════════════')
    console.log('  Webhook Database Verification')
    console.log('══════════════════════════════════════════════════════')

    // 1. Insert a probe row → confirms table exists + service_role can insert
    const { error: insertErr } = await db
        .from('webhook_events')
        .insert({ event_id: probeId, event_type: 'verify_probe' })

    if (insertErr) {
        console.error(`  ❌ Table webhook_events: MISSING or insert failed`)
        console.error(`    Error: ${insertErr.message} (code: ${insertErr.code})`)
        console.error('    → Run migration 003_webhook_idempotency.sql in Supabase SQL Editor')
        process.exit(1)
    }
    console.log('  Table webhook_events: ✅ EXISTS')
    console.log('  service_role INSERT:  ✅ WORKS')

    // 2. Insert the same event_id again → confirms UNIQUE constraint
    const { error: dupErr } = await db
        .from('webhook_events')
        .insert({ event_id: probeId, event_type: 'verify_probe_dup' })

    if (dupErr && dupErr.code === '23505') {
        console.log('  UNIQUE constraint on event_id: ✅ EXISTS (duplicate rejected with 23505)')
    } else if (dupErr) {
        console.log(`  UNIQUE constraint on event_id: ❌ MISSING (duplicate insert error: ${dupErr.code} ${dupErr.message})`)
    } else {
        console.log('  UNIQUE constraint on event_id: ❌ MISSING (duplicate insert succeeded)')
    }

    // 3. Clean up probe rows
    const { error: delErr } = await db
        .from('webhook_events')
        .delete()
        .eq('event_id', probeId)

    if (delErr) {
        console.log(`  Cleanup: ⚠️ could not delete probe row (${delErr.message})`)
    } else {
        console.log('  Cleanup: ✅ probe rows removed')
    }

    // 4. Count existing webhook_events rows
    const { count, error: countErr } = await db
        .from('webhook_events')
        .select('id', { count: 'exact', head: true })

    if (countErr) {
        console.log(`  Existing rows: ⚠️ could not count (${countErr.message})`)
    } else {
        console.log(`  Existing webhook_events rows: ${count}`)
    }

    console.log('──────────────────────────────────────────────────────')
    console.log('  ✅ Verification complete')
    process.exit(0)
}

main()