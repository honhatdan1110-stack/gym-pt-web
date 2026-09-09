const { createClient } = require('@supabase/supabase-js')
const sb = createClient('https://ycwiplojbsbjybmvvuqi.supabase.co', 'sb_publishable_TM5Btk4LE0w_8A_dJNYfbw_NPgWmBeK')

async function check() {
  // Check current profile
  const { data: profiles, error } = await sb.from('profiles').select('*')
  console.log('Profiles:', JSON.stringify(profiles, null, 2))
  if (error) console.log('Error:', error.message)

  // Check RLS policies
  const { data: policies, error: pErr } = await sb.rpc('get_policies', { table_name: 'profiles' }).maybeSingle()
  if (pErr) console.log('Policies RPC error:', pErr.message)
  else console.log('Policies:', JSON.stringify(policies, null, 2))
}

check()
