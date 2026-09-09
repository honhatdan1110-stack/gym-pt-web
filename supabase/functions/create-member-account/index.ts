import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return response({ error: 'Missing authorization' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!serviceKey) return response({ error: 'Server account provisioning is not configured' }, 500)

  const callerClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } } })
  const admin = createClient(url, serviceKey)
  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) return response({ error: 'Invalid session' }, 401)

  const { data: callerProfile, error: profileError } = await admin.from('profiles').select('role').eq('id', callerData.user.id).maybeSingle()
  if (profileError || callerProfile?.role !== 'pt') return response({ error: 'Only PT accounts can provision members' }, 403)

  let body: { clientId?: string; mode?: 'invite' | 'temporary'; temporaryPassword?: string }
  try { body = await request.json() } catch { return response({ error: 'Invalid JSON body' }, 400) }
  if (!body.clientId || !['invite', 'temporary'].includes(body.mode ?? '')) return response({ error: 'clientId and mode are required' }, 400)

  const { data: client, error: clientError } = await admin.from('clients').select('id,name,email,user_id').eq('id', body.clientId).eq('pt_id', callerData.user.id).maybeSingle()
  if (clientError || !client) return response({ error: 'Member profile not found' }, 404)
  if (client.user_id) return response({ error: 'Member already has an account' }, 409)
  const email = client.email.trim().toLowerCase()
  if (!email || !email.includes('@')) return response({ error: 'Member needs a valid email before receiving an account' }, 400)
  if (body.mode === 'temporary' && (!body.temporaryPassword || body.temporaryPassword.length < 8)) return response({ error: 'Temporary password must be at least 8 characters' }, 400)

  let createdUserId: string | undefined
  try {
    const result = body.mode === 'invite'
      ? await admin.auth.admin.inviteUserByEmail(email)
      : await admin.auth.admin.createUser({ email, password: body.temporaryPassword!, email_confirm: true })
    if (result.error || !result.data.user) return response({ error: result.error?.message ?? 'Could not create member account' }, 400)
    createdUserId = result.data.user.id

    const { error: linkError } = await admin.from('clients').update({ user_id: createdUserId, account_status: body.mode === 'invite' ? 'invited' : 'active', updated_at: new Date().toISOString() }).eq('id', client.id).eq('pt_id', callerData.user.id)
    if (linkError) throw linkError
    const { error: memberProfileError } = await admin.from('profiles').upsert({ id: createdUserId, role: 'member', full_name: client.name, email })
    if (memberProfileError) throw memberProfileError
    return response({ email, accountStatus: body.mode === 'invite' ? 'invited' : 'active', ...(body.mode === 'temporary' ? { temporaryPassword: body.temporaryPassword } : {}) })
  } catch (error) {
    if (createdUserId) await admin.auth.admin.deleteUser(createdUserId)
    return response({ error: error instanceof Error ? error.message : 'Could not link member account' }, 500)
  }
})
