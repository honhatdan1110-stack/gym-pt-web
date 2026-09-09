const { createClient } = require('@supabase/supabase-js')
const sb = createClient('https://ycwiplojbsbjybmvvuqi.supabase.co', 'sb_publishable_TM5Btk4LE0w_8A_dJNYfbw_NPgWmBeK')

async function fix() {
  // Try using rpc to run raw SQL
  const { data, error } = await sb.rpc('exec_sql', { query: "SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position" })
  if (error) {
    console.log('RPC not available, trying direct approach...')
    // Try to see what the check constraint is
    const { data: c2, error: e2 } = await sb.rpc('exec_sql', { query: "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'profiles'::regclass AND contype = 'c'" })
    if (e2) console.log('Constraint check error:', e2.message)
    else console.log('Constraints:', JSON.stringify(c2, null, 2))
  } else {
    console.log('Columns:', JSON.stringify(data, null, 2))
  }

  // Try update with role constraint info
  const { data: profiles, error: e3 } = await sb.from('profiles').select('*')
  console.log('All profiles:', JSON.stringify(profiles, null, 2))
}

fix()
